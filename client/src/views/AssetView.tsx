import React, { useState, useEffect, useMemo } from 'react';
import { ViewProps, ROLE_META, t } from '../types';
import { useCurrentUser } from '../auth/session';
import { assetConfigFor, isMyCustody, isMyRequisition } from './asset/config';
import { queueIncidentDraft } from './incident/handoff';
import { showToast } from '../components/ToastManager';
import {
  useAssetStore,
  AssetCategory,
  AssetRecord,
  LifecycleStage,
  calculateAssetFinancials,
  getAssetRoleConfig,
} from '../store/assetStore';
import AssetLifecycleStepper from '../components/asset/AssetLifecycleStepper';
import {
  RegisterAssetModal,
  TransferAssetModal,
  CreateWorkOrderModal,
  SubmitAssetRequisitionModal,
  InitiateDecommissionModal,
  FinalizeDisposalModal,
  DepreciationScheduleModal,
  AssetPassportModal,
  AssetScannerModal,
} from '../components/asset/AssetModals';
import RejectionExplanationModal, { RejectionData } from '../components/RejectionExplanationModal';
import { Button, EmptyState, PageHeader, StatusPill } from '../components/ui';
import {
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Search,
  Download,
  Plus,
  Barcode,
  CheckCircle,
  Clock,
  DollarSign,
  RotateCcw,
  ArrowLeft,
  FileText,
  ArrowRightLeft,
  Layers,
  History,
  Package,
  Archive,
  FilePlus,
  UserCheck,
  ShieldAlert,
  CheckSquare,
  Square,
  Eye,
  X,
  LayoutGrid,
  Table as TableIcon,
  QrCode,
  ExternalLink,
  Check,
} from 'lucide-react';

type MainModuleTab = 'register' | 'maintenance' | 'financials' | 'transfers' | 'disposal';
type InspectorSubTab = 'overview' | 'timeline' | 'custody' | 'spares';
type KpiQuickFilter = 'none' | 'pending_signoff' | 'cal_alerts' | 'eol_watch';

const assetServiceDue = (a: AssetRecord) =>
  a.lifecycleStage !== 'disposed'
  && a.lifecycleStage !== 'decommissioned'
  && (a.lifecycleStage === 'calibration_due' || a.lifecycleStage === 'maintenance' || (a.daysToService > 0 && a.daysToService <= 30));

const assetIsPlantSide = (a: AssetRecord) =>
  a.category === 'plant' || a.category === 'safety' || a.category === 'lab' || a.category === 'vehicle';

const assetShowsSpares = (a: AssetRecord) => a.spares.length > 0;

const assetShowsSafetyIncident = (a: AssetRecord) => a.category === 'plant' || a.category === 'safety';

export default function AssetView({ role, lang, onNavigate }: ViewProps) {
  const {
    assets,
    workOrders,
    requisitions,
    transfers,
    registerAsset,
    acknowledgeCustody,
    initiateTransfer,
    completeTransfer,
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
  } = useAssetStore();

  const user = useCurrentUser();
  const roleConfig = useMemo(
    () => (user ? assetConfigFor(user) : { ...getAssetRoleConfig('employee'), isSelfServiceOnly: true }),
    [user],
  );
  const currentPersona = { ...ROLE_META[role], name: user?.name ?? '', empId: user?.empId ?? '', dept: user?.dept ?? '' };

  // Navigation & Layout Modes
  const [activeTab, setActiveTab] = useState<MainModuleTab>('register');
  const [inspectorTab, setInspectorTab] = useState<InspectorSubTab>('overview');
  const [viewMode, setViewMode] = useState<'cockpit' | 'table'>('cockpit');
  const [mobileTab, setMobileTab] = useState<'list' | 'detail'>('list');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'all' | AssetCategory>(roleConfig.defaultCategory);
  const [facilityFilter, setFacilityFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('active_all');
  const [kpiFilter, setKpiFilter] = useState<KpiQuickFilter>('none');
  const [searchTerm, setSearchTerm] = useState('');
  const [woFilter, setWoFilter] = useState<'all' | 'open' | 'cal' | 'completed'>('all');
  const [woSearch, setWoSearch] = useState('');

  // Selected Asset ID
  const [selectedAssetId, setSelectedAssetId] = useState<string>('AST-001');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Modal Triggers
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [showRequisitionModal, setShowRequisitionModal] = useState(false);
  const [showDecommissionModal, setShowDecommissionModal] = useState(false);
  const [disposalTargetAsset, setDisposalTargetAsset] = useState<AssetRecord | null>(null);
  const [scheduleTargetAsset, setScheduleTargetAsset] = useState<AssetRecord | null>(null);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const canReceiveTransfer = (trf: { toCustodianEmpId?: string }) =>
    roleConfig.canTransferCustody || (!!user && trf.toCustodianEmpId === user.empId);

  // Sync default filter and valid tab on role switch
  useEffect(() => {
    setCategoryFilter(roleConfig.defaultCategory);
    setStageFilter('active_all');
    setKpiFilter('none');
    if (roleConfig.isSelfServiceOnly && (activeTab === 'financials' || activeTab === 'disposal')) {
      setActiveTab('register');
    }
  }, [role, roleConfig.defaultCategory, roleConfig.isSelfServiceOnly]);

  // Role-Scoped Visible Assets
  const roleScopedAssets = useMemo(() => {
    if (roleConfig.isSelfServiceOnly) {
      return user ? assets.filter((a) => isMyCustody(a, user)) : [];
    }
    return assets;
  }, [assets, roleConfig.isSelfServiceOnly, user]);

  // Live Category Counts (excluding disposed unless stageFilter includes disposed)
  const categoryCounts = useMemo(() => {
    const pool = roleScopedAssets.filter((a) =>
      stageFilter === 'disposed'
        ? a.lifecycleStage === 'disposed'
        : stageFilter === 'all'
        ? true
        : a.lifecycleStage !== 'disposed'
    );
    const counts: Record<string, number> = {
      all: pool.length,
      plant: 0,
      vehicle: 0,
      it: 0,
      safety: 0,
      lab: 0,
      corporate: 0,
    };
    pool.forEach((a) => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });
    return counts;
  }, [roleScopedAssets, stageFilter]);

  // Filtered Register List
  const filteredAssets = useMemo(() => {
    return roleScopedAssets.filter((a) => {
      const matchesCat = categoryFilter === 'all' || a.category === categoryFilter;
      const matchesSite = facilityFilter === 'all' || a.facility === facilityFilter;

      let matchesStage = true;
      if (stageFilter === 'active_all') {
        matchesStage = a.lifecycleStage !== 'disposed';
      } else if (stageFilter !== 'all') {
        matchesStage = a.lifecycleStage === stageFilter;
      }

      let matchesKpi = true;
      if (kpiFilter === 'pending_signoff') {
        matchesKpi = !a.custodianAcknowledged && a.lifecycleStage !== 'disposed';
      } else if (kpiFilter === 'cal_alerts') {
        matchesKpi =
          a.lifecycleStage === 'calibration_due' ||
          a.lifecycleStage === 'maintenance' ||
          (a.lifecycleStage !== 'disposed' && a.daysToService > 0 && a.daysToService <= 30);
      } else if (kpiFilter === 'eol_watch') {
        const f = calculateAssetFinancials(a);
        matchesKpi = a.lifecycleStage === 'decommissioned' || (a.lifecycleStage !== 'disposed' && f.isEconomicEoLCandidate);
      }

      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.tag.toLowerCase().includes(q) ||
        a.sapAssetNo.toLowerCase().includes(q) ||
        a.serialNo.toLowerCase().includes(q) ||
        a.custodian.toLowerCase().includes(q) ||
        a.functionalLocation.toLowerCase().includes(q);

      return matchesCat && matchesSite && matchesStage && matchesKpi && matchesSearch;
    });
  }, [roleScopedAssets, categoryFilter, facilityFilter, stageFilter, kpiFilter, searchTerm]);

  const hasActiveFilters =
    categoryFilter !== 'all' ||
    facilityFilter !== 'all' ||
    stageFilter !== 'active_all' ||
    kpiFilter !== 'none' ||
    searchTerm.trim() !== '';

  const resetAllFilters = () => {
    setCategoryFilter('all');
    setFacilityFilter('all');
    setStageFilter('active_all');
    setKpiFilter('none');
    setSearchTerm('');
  };

  // Keep selectedAsset synchronized with live store updates & current filtered results
  const selectedAsset = useMemo(() => {
    const inFiltered = filteredAssets.find((a) => a.id === selectedAssetId);
    if (inFiltered) return inFiltered;
    if (filteredAssets.length > 0) return filteredAssets[0];
    return roleScopedAssets.find((a) => a.id === selectedAssetId) || roleScopedAssets[0] || null;
  }, [roleScopedAssets, filteredAssets, selectedAssetId]);

  useEffect(() => {
    if (selectedAsset && selectedAsset.id !== selectedAssetId) {
      setSelectedAssetId(selectedAsset.id);
    }
  }, [selectedAsset, selectedAssetId]);

  useEffect(() => {
    const a = assets.find((x) => x.id === selectedAssetId);
    if (!a) return;
    setInspectorTab(!a.custodianAcknowledged ? 'custody' : 'overview');
  }, [selectedAssetId]);

  // Cross-Tab Deep-Link Helper: Jump straight to any asset's 360° Dossier
  const inspectAssetInCockpit = (assetId: string) => {
    const target = assets.find((a) => a.id === assetId);
    if (!target) return;
    if (target.lifecycleStage === 'disposed' && stageFilter === 'active_all') {
      setStageFilter('all');
    }
    setCategoryFilter('all');
    setKpiFilter('none');
    setSelectedAssetId(target.id);
    setActiveTab('register');
    setViewMode('cockpit');
    setMobileTab('detail');
  };

  // Scoped Work Orders & Requisitions
  const baseWorkOrders = useMemo(() => {
    return roleConfig.isSelfServiceOnly
      ? workOrders.filter((w) => roleScopedAssets.some((a) => a.id === w.assetId))
      : workOrders;
  }, [workOrders, roleConfig.isSelfServiceOnly, roleScopedAssets]);

  const visibleWorkOrders = useMemo(() => {
    return baseWorkOrders.filter((w) => {
      const matchesTab =
        woFilter === 'all'
          ? true
          : woFilter === 'open'
          ? w.status !== 'completed'
          : woFilter === 'cal'
          ? w.type === 'CAL'
          : w.status === 'completed';
      const q = woSearch.trim().toLowerCase();
      const matchesQ =
        !q ||
        w.woNumber.toLowerCase().includes(q) ||
        w.assetTag.toLowerCase().includes(q) ||
        w.assetName.toLowerCase().includes(q) ||
        w.title.toLowerCase().includes(q) ||
        w.assignedEngineer.toLowerCase().includes(q);
      return matchesTab && matchesQ;
    });
  }, [baseWorkOrders, woFilter, woSearch]);

  const visibleRequisitions = useMemo(() => {
    if (roleConfig.isSelfServiceOnly) {
      return user ? requisitions.filter((r) => isMyRequisition(r, user)) : [];
    }
    return requisitions;
  }, [requisitions, roleConfig.isSelfServiceOnly, user]);

  // Portfolio KPI Aggregations
  const portfolioStats = useMemo(() => {
    const activeOnly = roleScopedAssets.filter((a) => a.lifecycleStage !== 'disposed');
    let totalGross = 0;
    let totalNbv = 0;
    let totalAccDep = 0;
    let totalOpex = 0;
    let totalTco = 0;
    let eolCandidates = 0;

    activeOnly.forEach((a) => {
      const f = calculateAssetFinancials(a);
      totalGross += f.grossCapitalizedCost;
      totalNbv += f.netBookValue;
      totalAccDep += f.accumulatedDepreciation;
      totalOpex += a.cumulativeMaintenanceOpex;
      totalTco += f.totalCostOfOwnership;
      if (f.isEconomicEoLCandidate) eolCandidates += 1;
    });

    const operationalCount = activeOnly.filter((a) => a.lifecycleStage === 'operational').length;
    const availabilityPct = activeOnly.length > 0 ? ((operationalCount / activeOnly.length) * 100).toFixed(1) : '100.0';
    const calAlerts = activeOnly.filter(
      (a) =>
        a.lifecycleStage === 'calibration_due' ||
        a.lifecycleStage === 'maintenance' ||
        (a.daysToService > 0 && a.daysToService <= 30)
    ).length;
    const pendingSignOffs = activeOnly.filter((a) => !a.custodianAcknowledged).length;

    return {
      activeCount: activeOnly.length,
      totalGross,
      totalNbv,
      totalAccDep,
      totalOpex,
      totalTco,
      eolCandidates,
      availabilityPct,
      calAlerts,
      pendingSignOffs,
    };
  }, [roleScopedAssets]);

  const decommissionedAssets = useMemo(
    () => assets.filter((a) => a.lifecycleStage === 'decommissioned'),
    [assets]
  );
  const disposedAssets = useMemo(
    () => assets.filter((a) => a.lifecycleStage === 'disposed'),
    [assets]
  );

  // Active open transfer for selectedAsset (if in_transfer)
  const selectedOpenTransfer = useMemo(() => {
    if (!selectedAsset) return null;
    return transfers.find((tr) => tr.assetId === selectedAsset.id && tr.status === 'in_transit') || null;
  }, [selectedAsset, transfers]);

  const bn = (n: number) => (lang === 'bn' ? n.toLocaleString('bn-BD') : String(n));
  const fmtTaka = (val: number) => `৳${Math.round(val).toLocaleString('en-IN')}`;
  const fmtBdtShort = (val: number) => {
    if (val >= 10000000) return `৳${(val / 10000000).toFixed(2)} ${t('Cr', 'কোটি', lang)}`;
    if (val >= 100000) return `৳${(val / 100000).toFixed(2)} ${t('Lakh', 'লক্ষ', lang)}`;
    return fmtTaka(val);
  };

  const getStageBadge = (stage: LifecycleStage, daysToService?: number) => {
    switch (stage) {
      case 'operational':
        if (daysToService !== undefined && daysToService > 0 && daysToService <= 30) {
          return <StatusPill tone="warn">{t(`Service in ${daysToService}d`, `${bn(daysToService)} দিনে সার্ভিস`, lang)}</StatusPill>;
        }
        return <StatusPill tone="success">{t('Running', 'সক্রিয় চালু', lang)}</StatusPill>;
      case 'in_stock':
        return <StatusPill tone="info">{t('In warehouse', 'স্টোরে রাখা', lang)}</StatusPill>;
      case 'in_transfer':
        return <StatusPill tone="purple">{t('In transit', 'স্থানান্তরধীন', lang)}</StatusPill>;
      case 'calibration_due':
        return <StatusPill tone="danger">{t(`Service due (${daysToService ?? 10}d)`, `সার্ভিস বাকি (${bn(daysToService ?? 10)} দিন)`, lang)}</StatusPill>;
      case 'maintenance':
        return <StatusPill tone="warn">{t('In repair', 'মেরামতাধীন', lang)}</StatusPill>;
      case 'decommissioned':
        return <StatusPill tone="danger">{t('Ready to retire', 'অবসরের অপেক্ষায়', lang)}</StatusPill>;
      case 'disposed':
        return <StatusPill tone="neutral">{t('Archived', 'আর্কাইভ', lang)}</StatusPill>;
    }
  };

  const handleExportMasterLedgerCsv = () => {
    const header =
      'Tag,Ledger_No,Title,Category,Facility,GL_Cost_Center,Lifecycle_Stage,Method,Gross_CAPEX_BDT,Accumulated_Dep_BDT,Net_Book_Value_BDT,Cumulative_OPEX_BDT,TCO_BDT,Repair_Ratio_Pct\n';
    const rows = roleScopedAssets
      .map((a) => {
        const f = calculateAssetFinancials(a);
        return `"${a.tag}","${a.sapAssetNo}","${a.name}","${a.category}","${a.facility}","${a.glCostCenter}","${a.lifecycleStage}","${a.depreciationMethod}",${f.grossCapitalizedCost},${f.accumulatedDepreciation},${f.netBookValue},${a.cumulativeMaintenanceOpex},${f.totalCostOfOwnership},${f.repairToCapexRatioPct}`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'BOGCL_Enterprise_Asset_Lifetime_FI_AA_Ledger.csv';
    link.click();
    URL.revokeObjectURL(url);
    showToast(t('Exported fixed-asset and TCO ledger (CSV).', 'সম্পূর্ণ স্থায়ী সম্পদ ও অবচয় খতিয়ান ডাউনলোড হয়েছে।', lang), 'success');
  };

  const handleConfirmAssetReject = (data: RejectionData) => {
    if (!selectedAsset) return;
    flagAssetDeficiency(
      selectedAsset.id,
      {
        reason: data.reasonCategory,
        observation: data.observation,
        improvementsRequired: data.improvementsRequired,
      },
      currentPersona.name,
      currentPersona.label,
    );
    setShowRejectModal(false);
    showToast(
      t(
        `Fault / Deficiency logged on ${selectedAsset.tag} & Corrective Work Order auto-dispatched.`,
        `${selectedAsset.tag}-এ ত্রুটি নথিভুক্ত ও মেরামত কার্যাদেশ তৈরি হয়েছে।`,
        lang,
      ),
      'warn',
    );
  };

  const selectedFinancials = selectedAsset ? calculateAssetFinancials(selectedAsset) : null;

  /** Sort assets so machines needing attention come first. */
  const urgencyRank = (a: AssetRecord): number => {
    if (a.lifecycleStage === 'disposed') return 90;
    if (a.defectQuery) return 5;
    if (!a.custodianAcknowledged) return 10;
    if (a.lifecycleStage === 'calibration_due' || a.lifecycleStage === 'maintenance') return 15;
    if (a.lifecycleStage === 'decommissioned') return 20;
    if (a.daysToService > 0 && a.daysToService <= 30) return 25;
    if (a.lifecycleStage === 'in_transfer') return 30;
    if (a.lifecycleStage === 'in_stock') return 35;
    return 50;
  };

  const sortedAssets = useMemo(() => {
    return [...filteredAssets].sort((a, b) => {
      const r = urgencyRank(a) - urgencyRank(b);
      if (r !== 0) return r;
      if (a.daysToService !== b.daysToService) return a.daysToService - b.daysToService;
      return a.healthScore - b.healthScore;
    });
  }, [filteredAssets]);

  const activeOnlyCount = roleScopedAssets.filter((a) => a.lifecycleStage !== 'disposed').length;
  const workingCount = roleScopedAssets.filter((a) => a.lifecycleStage === 'operational').length;
  const openWoCount = baseWorkOrders.filter((w) => w.status !== 'completed').length;
  const openReqCount = visibleRequisitions.filter((r) => r.stage !== 'commissioned' && r.stage !== 'rejected').length;

  const verdictWarn = portfolioStats.calAlerts > 0 || portfolioStats.pendingSignOffs > 0 || decommissionedAssets.length > 0;
  const verdict = roleConfig.isSelfServiceOnly
    ? activeOnlyCount === 0
      ? roleConfig.canRequestEquipment
        ? t('No equipment is assigned to you right now. Use "Request equipment" if you need a machine or device.', 'আপনার নামে এখন কোনো সরঞ্জাম বরাদ্দ নেই। প্রয়োজন হলে "যন্ত্রপাতির আবেদন" চাপুন।', lang)
        : t('No equipment is assigned to you.', 'আপনার নামে কোনো সরঞ্জাম বরাদ্দ নেই।', lang)
      : t(
        `${activeOnlyCount} ${activeOnlyCount === 1 ? 'item is' : 'items are'} in your custody${portfolioStats.pendingSignOffs > 0 ? `. ${portfolioStats.pendingSignOffs} ${portfolioStats.pendingSignOffs === 1 ? 'needs' : 'need'} your handover signature` : ''}${portfolioStats.calAlerts > 0 ? `. ${portfolioStats.calAlerts} due for service soon` : ''}.`,
        `আপনার হেফাজতে ${bn(activeOnlyCount)}টি সরঞ্জাম আছে${portfolioStats.pendingSignOffs > 0 ? `। ${bn(portfolioStats.pendingSignOffs)}টিতে আপনার গ্রহণ স্বাক্ষর বাকি` : ''}${portfolioStats.calAlerts > 0 ? `। ${bn(portfolioStats.calAlerts)}টির সার্ভিসিং আসন্ন` : ''}।`,
        lang,
      )
    : t(
      `${activeOnlyCount} machines (${fmtBdtShort(portfolioStats.totalNbv)} book value), ${workingCount} working.${portfolioStats.calAlerts > 0 ? ` ${portfolioStats.calAlerts} need service or repair.` : ''}${portfolioStats.pendingSignOffs > 0 ? ` ${portfolioStats.pendingSignOffs} awaiting handover sign-off.` : ''}${decommissionedAssets.length > 0 ? ` ${decommissionedAssets.length} ready to retire.` : ''}`,
      `${bn(activeOnlyCount)}টি মেশিন (বর্তমান বইমূল্য ${fmtBdtShort(portfolioStats.totalNbv)}), ${bn(workingCount)}টি চালু।${portfolioStats.calAlerts > 0 ? ` ${bn(portfolioStats.calAlerts)}টির সার্ভিস বা মেরামত দরকার।` : ''}${portfolioStats.pendingSignOffs > 0 ? ` ${bn(portfolioStats.pendingSignOffs)}টিতে গ্রহণ স্বাক্ষর বাকি।` : ''}${decommissionedAssets.length > 0 ? ` ${bn(decommissionedAssets.length)}টি অবসরের অপেক্ষায়।` : ''}`,
      lang,
    );

  /** Plain status and next action for the selected machine. */
  const machineNextStep = (a: AssetRecord): { tone: 'ok' | 'warn'; text: string; cta?: React.ReactNode } => {
    if (a.lifecycleStage === 'disposed') {
      return {
        tone: 'ok',
        text: t(
          `Retired and archived under voucher ${a.disposalDossier?.sapRetirementVoucher ?? '—'}. Nothing for you to do.`,
          `ভাউচার ${a.disposalDossier?.sapRetirementVoucher ?? '—'}-এর অধীনে অবসরপ্রাপ্ত ও আর্কাইভ। আপনার কিছু করার নেই।`,
          lang,
        ),
      };
    }
    if (!a.custodianAcknowledged) {
      const isCustodian = !!user && isMyCustody(a, user);
      return {
        tone: 'warn',
        text: isCustodian
          ? t('Issued to you. Sign the handover receipt to confirm you received it in good condition.', 'আপনার নামে বরাদ্দ হয়েছে। ভালো অবস্থায় বুঝে পেয়েছেন নিশ্চিত করতে গ্রহণ স্বাক্ষর করুন।', lang)
          : t(`Issued to ${a.custodian}. Waiting for their handover signature. Nothing for you to do.`, `${a.custodian}-কে বরাদ্দ দেওয়া হয়েছে। তাঁর গ্রহণ স্বাক্ষরের অপেক্ষায়। আপনার কিছু করার নেই।`, lang),
        cta: isCustodian ? (
          <Button
            size="sm"
            variant="gold"
            icon={<Check size={13} />}
            onClick={() => {
              acknowledgeCustody(a.id, currentPersona.name, currentPersona.label);
              showToast(t(`Custody receipt signed for ${a.name}.`, `${a.name}-এর গ্রহণ স্বাক্ষর সম্পন্ন।`, lang), 'gold');
            }}
          >
            {t('Sign handover receipt', 'গ্রহণ স্বাক্ষর করুন', lang)}
          </Button>
        ) : undefined,
      };
    }
    if (a.lifecycleStage === 'in_transfer' && selectedOpenTransfer) {
      const canRecv = canReceiveTransfer(selectedOpenTransfer);
      return {
        tone: 'warn',
        text: canRecv
          ? t(`In transit to ${selectedOpenTransfer.toCustodian} at ${selectedOpenTransfer.toFacility}. Confirm when it arrives.`, `${selectedOpenTransfer.toFacility}-এ ${selectedOpenTransfer.toCustodian}-এর কাছে পথে আছে। পৌঁছালে প্রাপ্তি নিশ্চিত করুন।`, lang)
          : t(`In transit to ${selectedOpenTransfer.toCustodian} at ${selectedOpenTransfer.toFacility}. Waiting for receipt at destination.`, `${selectedOpenTransfer.toFacility}-এ ${selectedOpenTransfer.toCustodian}-এর কাছে পথে আছে। গন্তব্যে প্রাপ্তির অপেক্ষায়।`, lang),
        cta: canRecv ? (
          <Button
            size="sm"
            icon={<CheckCircle size={13} />}
            onClick={() => {
              completeTransfer(selectedOpenTransfer.id, currentPersona.name, currentPersona.label);
              showToast(t(`Gate pass ${selectedOpenTransfer.gatePassNo} closed and received.`, `গেট পাস ${selectedOpenTransfer.gatePassNo} সম্পন্ন ও গৃহীত।`, lang), 'success');
            }}
          >
            {t('Confirm arrival', 'প্রাপ্তি নিশ্চিত করুন', lang)}
          </Button>
        ) : undefined,
      };
    }
    if (a.lifecycleStage === 'in_stock') {
      return {
        tone: 'warn',
        text: roleConfig.canTransferCustody
          ? t('Sitting in the central warehouse. Assign it to an operator or plant unit to put it into service.', 'কেন্দ্রীয় স্টোরে রাখা আছে। চালু করতে একজন কর্মকর্তা বা ইউনিটে বরাদ্দ দিন।', lang)
          : t('Stored in the central warehouse until assigned.', 'বরাদ্দ না হওয়া পর্যন্ত কেন্দ্রীয় স্টোরে রাখা আছে।', lang),
        cta: roleConfig.canTransferCustody ? (
          <Button size="sm" icon={<ArrowRightLeft size={13} />} onClick={() => setShowTransferModal(true)}>
            {t('Assign custodian', 'হেফাজতকারী বরাদ্দ দিন', lang)}
          </Button>
        ) : undefined,
      };
    }
    if (a.lifecycleStage === 'decommissioned') {
      const cl = a.disposalDossier?.checklist;
      const done = cl ? [cl.technicalSurveySigned, cl.decontaminationOrDataWipeCertified, cl.sparesHarvested, cl.financeCfoVetted].filter(Boolean).length : 0;
      return {
        tone: 'warn',
        text: roleConfig.canAuthorizeWriteOff
          ? t(`Marked for retirement (${done} of 4 pre-disposal checks done). Verify the checklist and authorize write-off.`, `অবসরের জন্য চিহ্নিত (৪টি যাচাইয়ের ${bn(done)}টি সম্পন্ন)। চেকলিস্ট দেখে চূড়ান্ত অবলোপন অনুমোদন করুন।`, lang)
          : t(`Marked for retirement (${done} of 4 checks done). Waiting for CFO / Chairman write-off approval.`, `অবসরের জন্য চিহ্নিত (৪টি যাচাইয়ের ${bn(done)}টি সম্পন্ন)। চূড়ান্ত অবলোপন অনুমোদনের অপেক্ষায়।`, lang),
        cta: (
          <Button size="sm" variant="gold" onClick={() => setActiveTab('disposal')}>
            {t('Open retirement checklist', 'অবসর চেকলিস্ট খুলুন', lang)}
          </Button>
        ),
      };
    }
    if (assetServiceDue(a)) {
      return {
        tone: 'warn',
        text: a.lifecycleStage === 'maintenance'
          ? t(`Under repair. Record the check when the work is finished.`, `মেরামতাধীন। কাজ শেষ হলে সার্ভিস নথিভুক্ত করুন।`, lang)
          : t(`Service or inspection is due in ${a.daysToService} days (${a.nextServiceDate}).`, `আগামী ${bn(a.daysToService)} দিনের মধ্যে (${a.nextServiceDate}) সার্ভিস বা পরীক্ষা বাকি।`, lang),
        cta: roleConfig.canCertifyCalibration ? (
          <Button
            size="sm"
            icon={<CheckCircle size={13} />}
            onClick={() => {
              certifyAssetDirect(a.id, currentPersona.name, currentPersona.label);
              showToast(
                t(
                  `Check recorded for ${a.name}. Next service is in ${a.calibrationCycleDays} days.`,
                  `${a.name}-এর সার্ভিস নথিভুক্ত। পরবর্তী সার্ভিস ${bn(a.calibrationCycleDays)} দিন পরে।`,
                  lang,
                ),
                'success',
              );
            }}
          >
            {t('Record the check as done', 'সার্ভিস সম্পন্ন নথিভুক্ত করুন', lang)}
          </Button>
        ) : roleConfig.canManageWorkOrders ? (
          <Button size="sm" icon={<Wrench size={13} />} onClick={() => setShowWorkOrderModal(true)}>
            {t('Create repair order', 'মেরামত আদেশ', lang)}
          </Button>
        ) : undefined,
      };
    }
    return {
      tone: 'ok',
      text: t(
        `Running normally (${a.healthScore}% health). Next service in ${a.daysToService} days (${a.nextServiceDate}). Nothing for you to do.`,
        `স্বাভাবিকভাবে চলছে (${bn(a.healthScore)}% স্বাস্থ্য)। পরবর্তী সার্ভিস ${bn(a.daysToService)} দিন পরে (${a.nextServiceDate})। আপনার কিছু করার নেই।`,
        lang,
      ),
    };
  };

  const hasHeaderActions =
    roleConfig.canScanTag || roleConfig.canRequestEquipment || roleConfig.canRegisterAsset;

  return (
    <div className="view-container">
      {hasHeaderActions && (
        <PageHeader
          actions={
            <>
              {roleConfig.canScanTag && (
                <Button variant="secondary" icon={<Barcode size={14} />} onClick={() => setShowScanModal(true)}>
                  {t('Scan tag', 'ট্যাগ স্ক্যান', lang)}
                </Button>
              )}
              {roleConfig.canRequestEquipment && (
                <Button variant="secondary" icon={<FilePlus size={14} />} onClick={() => setShowRequisitionModal(true)}>
                  {t('Request equipment', 'যন্ত্রপাতির আবেদন', lang)}
                </Button>
              )}
              {roleConfig.canRegisterAsset && (
                <Button icon={<Plus size={14} />} onClick={() => setShowRegisterModal(true)}>
                  {t('Add machine', 'নতুন মেশিন যুক্ত', lang)}
                </Button>
              )}
            </>
          }
        />
      )}

      <p className={`lv-status ${verdictWarn ? 'warn' : 'ok'}`} role="status">
        {verdictWarn ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
        <span>{verdict}</span>
      </p>

      {/* Main module tabs */}
      <div className="eam-nav-bar">
        <button
          type="button"
          className={`eam-nav-tab ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => setActiveTab('register')}
        >
          <Layers size={15} />
          <span>{roleConfig.isSelfServiceOnly ? t('My equipment', 'আমার সরঞ্জাম', lang) : t('Machines', 'মেশিন তালিকা', lang)}</span>
          <span className="eam-nav-count">{activeOnlyCount}</span>
        </button>

        <button
          type="button"
          className={`eam-nav-tab ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          <Wrench size={15} />
          <span>{t('Repairs & service', 'মেরামত ও সার্ভিস', lang)}</span>
          <span className={`eam-nav-count ${openWoCount > 0 ? 'warn' : ''}`}>{openWoCount}</span>
        </button>

        <button
          type="button"
          className={`eam-nav-tab ${activeTab === 'transfers' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfers')}
        >
          <ArrowRightLeft size={15} />
          <span>
            {roleConfig.isSelfServiceOnly
              ? t('My requests', 'আমার আবেদন', lang)
              : t('Requests & transfers', 'আবেদন ও স্থানান্তর', lang)}
          </span>
          <span className="eam-nav-count">{openReqCount}</span>
        </button>

        {!roleConfig.isSelfServiceOnly && (
          <button
            type="button"
            className={`eam-nav-tab ${activeTab === 'disposal' ? 'active' : ''}`}
            onClick={() => setActiveTab('disposal')}
          >
            <Archive size={15} />
            <span>{t('Retirement & scrap', 'অবসর ও স্ক্র্যাপ', lang)}</span>
            {decommissionedAssets.length > 0 && (
              <span className="eam-nav-count danger">{decommissionedAssets.length}</span>
            )}
          </button>
        )}

        {roleConfig.canViewFinancialLedger && (
          <button
            type="button"
            className={`eam-nav-tab ${activeTab === 'financials' ? 'active' : ''}`}
            onClick={() => setActiveTab('financials')}
          >
            <DollarSign size={15} />
            <span>{t('Book value & depreciation', 'বইমূল্য ও অবচয়', lang)}</span>
          </button>
        )}
      </div>

      {/* TAB 1: MACHINES REGISTER & DETAIL PANEL */}
      {activeTab === 'register' && (
        <>
          <div className="card mb-4">
            <div className="workforce-toolbar roster-toolbar asset-toolbar">
              <div className="workforce-tabs" role="group" aria-label={t('Machine status', 'মেশিনের অবস্থা', lang)}>
                <button
                  type="button"
                  className={`workforce-tab${kpiFilter === 'none' && stageFilter === 'active_all' ? ' active' : ''}`}
                  aria-pressed={kpiFilter === 'none' && stageFilter === 'active_all'}
                  onClick={() => { setKpiFilter('none'); setStageFilter('active_all'); }}
                >
                  {t('All active', 'সব সক্রিয়', lang)} <b>{activeOnlyCount}</b>
                </button>
                <button
                  type="button"
                  className={`workforce-tab${kpiFilter === 'cal_alerts' ? ' active' : ''}`}
                  aria-pressed={kpiFilter === 'cal_alerts'}
                  onClick={() => { setStageFilter('active_all'); setKpiFilter((prev) => (prev === 'cal_alerts' ? 'none' : 'cal_alerts')); }}
                >
                  {t('Service due or in repair', 'সার্ভিস বাকি বা মেরামতাধীন', lang)} <b>{portfolioStats.calAlerts}</b>
                </button>
                {portfolioStats.pendingSignOffs > 0 && (
                  <button
                    type="button"
                    className={`workforce-tab${kpiFilter === 'pending_signoff' ? ' active' : ''}`}
                    aria-pressed={kpiFilter === 'pending_signoff'}
                    onClick={() => { setStageFilter('active_all'); setKpiFilter((prev) => (prev === 'pending_signoff' ? 'none' : 'pending_signoff')); }}
                  >
                    {t('Awaiting sign-off', 'স্বাক্ষর বাকি', lang)} <b>{portfolioStats.pendingSignOffs}</b>
                  </button>
                )}
                {!roleConfig.isSelfServiceOnly && decommissionedAssets.length > 0 && (
                  <button
                    type="button"
                    className={`workforce-tab${stageFilter === 'decommissioned' ? ' active' : ''}`}
                    aria-pressed={stageFilter === 'decommissioned'}
                    onClick={() => { setKpiFilter('none'); setStageFilter((prev) => (prev === 'decommissioned' ? 'active_all' : 'decommissioned')); }}
                  >
                    {t('Ready to retire', 'অবসরের অপেক্ষায়', lang)} <b>{decommissionedAssets.length}</b>
                  </button>
                )}
              </div>

              {!roleConfig.isSelfServiceOnly && (
                <div className="eam-view-switcher">
                  <button
                    type="button"
                    className={`eam-view-btn ${viewMode === 'cockpit' ? 'active' : ''}`}
                    onClick={() => setViewMode('cockpit')}
                  >
                    <LayoutGrid size={13} /> {t('Split view', 'স্প্লিট ভিউ', lang)}
                  </button>
                  <button
                    type="button"
                    className={`eam-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    <TableIcon size={13} /> {t('Table', 'টেবিল', lang)}
                  </button>
                </div>
              )}

              <div className="workforce-filter-row">
                <div className="workforce-search-wrap">
                  <Search size={14} className="workforce-search-icon" aria-hidden />
                  <input
                    type="search"
                    className="workforce-search-input"
                    placeholder={t('Search by machine name, place, operator or tag…', 'মেশিনের নাম, স্থান, অপারেটর বা ট্যাগ দিয়ে খুঁজুন…', lang)}
                    aria-label={t('Search machines', 'মেশিন খুঁজুন', lang)}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button type="button" className="workforce-search-clear" onClick={() => setSearchTerm('')} aria-label={t('Clear search', 'অনুসন্ধান মুছুন', lang)}>
                      <X size={13} />
                    </button>
                  )}
                </div>

                {!roleConfig.isSelfServiceOnly && (
                  <>
                    <select className="workforce-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as 'all' | AssetCategory)} aria-label={t('Category', 'ধরন', lang)}>
                      <option value="all">{t('Every category', 'সব ধরন', lang)} ({categoryCounts.all ?? 0})</option>
                      <option value="plant">{t('Refinery plant', 'রিফাইনারি প্ল্যান্ট', lang)} ({categoryCounts.plant ?? 0})</option>
                      <option value="vehicle">{t('Tankers & fleet', 'ট্যাংকার ও ফ্লিট', lang)} ({categoryCounts.vehicle ?? 0})</option>
                      <option value="it">{t('Control & IT', 'নিয়ন্ত্রণ ও আইটি', lang)} ({categoryCounts.it ?? 0})</option>
                      <option value="safety">{t('Safety gear', 'নিরাপত্তা সরঞ্জাম', lang)} ({categoryCounts.safety ?? 0})</option>
                      <option value="lab">{t('Lab instruments', 'পরীক্ষাগার যন্ত্র', lang)} ({categoryCounts.lab ?? 0})</option>
                      {(categoryCounts.corporate ?? 0) > 0 && (
                        <option value="corporate">{t('Corporate office', 'করপোরেট অফিস', lang)} ({categoryCounts.corporate ?? 0})</option>
                      )}
                    </select>
                    <select className="workforce-select" value={facilityFilter} onChange={(e) => setFacilityFilter(e.target.value)} aria-label={t('Site', 'স্থাপনা', lang)}>
                      <option value="all">{t('Every site', 'সব স্থাপনা', lang)}</option>
                      <option value="Keraniganj Bitumen Refinery">{t('Keraniganj Refinery', 'কেরানীগঞ্জ রিফাইনারি', lang)}</option>
                      <option value="Bashundhara Corporate HQ, Baridhara">{t('Baridhara Corporate HQ', 'বারিধারা করপোরেট সদর দপ্তর', lang)}</option>
                      <option value="Chattogram Patenga Terminal">{t('Chattogram Marine Terminal', 'চট্টগ্রাম সামুদ্রিক টার্মিনাল', lang)}</option>
                    </select>
                    <select className="workforce-select" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} aria-label={t('Stage', 'ধাপ', lang)}>
                      <option value="active_all">{t('Active (excluding archived)', 'সক্রিয় (আর্কাইভ বাদে)', lang)}</option>
                      <option value="operational">{t('In service', 'সক্রিয় চালু', lang)}</option>
                      <option value="in_stock">{t('In warehouse', 'স্টোরে রাখা', lang)}</option>
                      <option value="in_transfer">{t('In transit', 'স্থানান্তরধীন', lang)}</option>
                      <option value="calibration_due">{t('Service due', 'সার্ভিস বাকি', lang)}</option>
                      <option value="maintenance">{t('In repair', 'মেরামতাধীন', lang)}</option>
                      <option value="decommissioned">{t('Ready to retire', 'অবসরের অপেক্ষায়', lang)}</option>
                      <option value="disposed">{t('Archived', 'আর্কাইভ', lang)}</option>
                      <option value="all">{t('All (including archived)', 'সব (আর্কাইভসহ)', lang)}</option>
                    </select>
                    {hasActiveFilters && (
                      <button type="button" className="eam-reset-btn" onClick={resetAllFilters}>
                        {t('Clear filters', 'ফিল্টার মুছুন', lang)}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {viewMode === 'cockpit' && (
            <div className="mobile-view-toggle">
              <button type="button" className={mobileTab === 'list' ? 'active' : ''} onClick={() => setMobileTab('list')}>
                <Layers size={14} /> {t('Machines', 'মেশিন তালিকা', lang)} ({sortedAssets.length})
              </button>
              <button type="button" className={mobileTab === 'detail' ? 'active' : ''} onClick={() => setMobileTab('detail')}>
                <FileText size={14} /> {t('Selected machine', 'নির্বাচিত মেশিন', lang)}
              </button>
            </div>
          )}

          {viewMode === 'table' ? (
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon"><TableIcon size={16} /></div>
                  <div>
                    <div className="card-title">{t('All machines', 'মেশিনের তালিকা', lang)}</div>
                    <div className="card-subtitle">
                      {t(`Showing ${sortedAssets.length} — click any row to open its details`, `${bn(sortedAssets.length)}টি প্রদর্শিত — বিস্তারিত দেখতে যেকোনো সারিতে ক্লিক করুন`, lang)}
                    </div>
                  </div>
                </div>
                <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={handleExportMasterLedgerCsv}>
                  {t('Download CSV', 'সিএসভি ডাউনলোড', lang)}
                </Button>
              </div>

              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('Machine', 'মেশিন', lang)}</th>
                        <th>{t('Site & location', 'স্থাপনা ও অবস্থান', lang)}</th>
                        <th>{t('Operator', 'দায়িত্বপ্রাপ্ত', lang)}</th>
                        <th>{t('Book value', 'বর্তমান বইমূল্য', lang)}</th>
                        <th>{t('Health & next service', 'স্বাস্থ্য ও পরবর্তী সার্ভিস', lang)}</th>
                        <th>{t('Where it stands', 'বর্তমান অবস্থা', lang)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAssets.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-3)' }}>
                            {t('No machines match the active filters.', 'নির্বাচিত ফিল্টারে কোনো মেশিন পাওয়া যায়নি।', lang)}
                          </td>
                        </tr>
                      ) : (
                        sortedAssets.map((item) => {
                          const f = calculateAssetFinancials(item);
                          return (
                            <tr
                              key={item.id}
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                setSelectedAssetId(item.id);
                                setViewMode('cockpit');
                              }}
                            >
                              <td>
                                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-1)' }}>{item.name}</div>
                                <div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{item.oem} · {item.modelNo}</div>
                              </td>
                              <td>
                                <div style={{ fontSize: '12.5px', fontWeight: 600 }}>{item.facility.split(',')[0]}</div>
                                <div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{item.functionalLocation}</div>
                              </td>
                              <td>
                                <div style={{ fontSize: '12.5px', fontWeight: 600 }}>{item.custodian}</div>
                                {!item.custodianAcknowledged && item.lifecycleStage !== 'disposed' && (
                                  <span style={{ fontSize: '11px', color: 'var(--status-warning-text)', fontWeight: 600 }}>
                                    {t('Awaiting signature', 'স্বাক্ষর বাকি', lang)}
                                  </span>
                                )}
                              </td>
                              <td style={{ fontWeight: 700, fontSize: '13px' }}>
                                {item.lifecycleStage === 'disposed' ? t('Retired', 'অবসরপ্রাপ্ত', lang) : fmtBdtShort(f.netBookValue)}
                              </td>
                              <td>
                                {item.lifecycleStage === 'disposed' || item.lifecycleStage === 'decommissioned' ? (
                                  <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>—</span>
                                ) : (
                                  <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                                    <strong>{item.healthScore}%</strong> · {t(`in ${item.daysToService}d`, `${bn(item.daysToService)} দিন`, lang)}
                                  </div>
                                )}
                              </td>
                              <td>{getStageBadge(item.lifecycleStage, item.daysToService)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="eam-cockpit-grid">
              {/* LEFT PANEL: Clean asset list */}
              <div className={`eam-feed-panel ${mobileTab === 'detail' ? 'eam-mobile-hidden' : ''}`}>
                <div className="eam-feed-hd">
                  <div>
                    <div className="eam-feed-title">
                      <Layers size={15} style={{ color: 'var(--brand-crimson)' }} />
                      <span>
                        {roleConfig.isSelfServiceOnly
                          ? t('My equipment', 'আমার সরঞ্জাম', lang)
                          : t('Machines (needs attention first)', 'মেশিন তালিকা (জরুরি আগে)', lang)}
                      </span>
                    </div>
                    <div className="eam-feed-count">
                      {t(`Showing ${sortedAssets.length} of ${roleScopedAssets.length}`, `${bn(roleScopedAssets.length)}টির মধ্যে ${bn(sortedAssets.length)}টি`, lang)}
                    </div>
                  </div>
                </div>

                <div className="eam-feed-list">
                  {sortedAssets.length === 0 ? (
                    <EmptyState
                      compact
                      icon={<Layers size={20} />}
                      title={t('No machines match these filters', 'এই ফিল্টারে কোনো মেশিন নেই', lang)}
                      action={
                        hasActiveFilters ? (
                          <Button variant="secondary" size="sm" onClick={resetAllFilters}>
                            {t('Clear filters', 'ফিল্টার মুছুন', lang)}
                          </Button>
                        ) : undefined
                      }
                    />
                  ) : (
                    sortedAssets.map((item) => {
                      const isSelected = selectedAsset?.id === item.id;
                      const healthColor =
                        item.healthScore >= 85 ? 'var(--status-success-solid)' : item.healthScore >= 60 ? 'var(--status-warning-solid)' : 'var(--status-danger-solid)';

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`eam-feed-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedAssetId(item.id);
                            setMobileTab('detail');
                          }}
                        >
                          <div className="eam-feed-main">
                            <img className="eam-feed-photo" src={item.photo} alt={item.name} />
                            <div className="eam-feed-copy">
                              <div className="ast-row-top">
                                <span className="eam-feed-name">{item.name}</span>
                                {getStageBadge(item.lifecycleStage, item.daysToService)}
                              </div>

                              <div className="eam-feed-meta">
                                <span>{item.facility.split(',')[0]}</span>
                                <span>·</span>
                                <span>{item.custodian}</span>
                                {!item.custodianAcknowledged && item.lifecycleStage !== 'disposed' && (
                                  <span style={{ color: 'var(--status-warning-text)', fontWeight: 700 }}>
                                    · {t('Sign-off needed', 'স্বাক্ষর বাকি', lang)}
                                  </span>
                                )}
                              </div>

                              {item.lifecycleStage !== 'disposed' && item.lifecycleStage !== 'decommissioned' && (
                                <div className="ast-row-health">
                                  <div className="hs-bar" style={{ flex: 1 }} aria-hidden>
                                    <span style={{ width: `${item.healthScore}%`, background: healthColor }} />
                                  </div>
                                  <small>{t(`${item.healthScore}% health`, `${bn(item.healthScore)}% স্বাস্থ্য`, lang)}</small>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT PANEL: Clean detail card answering What / Where / Why / What next */}
              {selectedAsset && selectedFinancials && (() => {
                const next = machineNextStep(selectedAsset);
                return (
                  <div className={`eam-dossier-shell ${mobileTab === 'list' ? 'eam-mobile-hidden' : ''}`}>
                    <div className="ast-detail-head">
                      <button
                        type="button"
                        className="btn-outline mobile-view-toggle"
                        style={{ padding: '6px 12px', fontSize: '12px', width: 'auto', marginBottom: '10px' }}
                        onClick={() => setMobileTab('list')}
                      >
                        <ArrowLeft size={13} /> {t('Back to list', 'তালিকায় ফিরুন', lang)}
                      </button>

                      <div className="ast-head-top">
                        <div>
                          <h3 className="ast-title">{selectedAsset.name}</h3>
                          <p className="ast-origin">
                            {selectedAsset.facility} · {selectedAsset.functionalLocation} · {t('with', 'দায়িত্বে', lang)}{' '}
                            <strong>{selectedAsset.custodian}</strong>
                          </p>
                        </div>
                        {getStageBadge(selectedAsset.lifecycleStage, selectedAsset.daysToService)}
                      </div>

                      <img className="eam-detail-photo" src={selectedAsset.photo} alt={selectedAsset.name} />

                      <div className={`lv-status ${next.tone === 'warn' ? 'warn' : 'ok'}`} style={{ marginTop: 12, marginBottom: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: '1 1 240px' }}>
                          {next.tone === 'warn' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                          <span>{next.text}</span>
                        </div>
                        {next.cta}
                      </div>

                      {(() => {
                        const ended = selectedAsset.lifecycleStage === 'disposed' || selectedAsset.lifecycleStage === 'decommissioned';
                        const waitingSign = !selectedAsset.custodianAcknowledged;
                        const extras: React.ReactNode[] = [];
                        if (!ended && !waitingSign && roleConfig.canManageWorkOrders && !assetServiceDue(selectedAsset)) {
                          extras.push(
                            <Button key="wo" size="sm" variant="secondary" icon={<Wrench size={13} />} onClick={() => setShowWorkOrderModal(true)}>
                              {t('Create repair order', 'মেরামত আদেশ', lang)}
                            </Button>,
                          );
                        }
                        if (!ended && !waitingSign && roleConfig.canTransferCustody) {
                          extras.push(
                            <Button key="tr" size="sm" variant="secondary" icon={<ArrowRightLeft size={13} />} onClick={() => setShowTransferModal(true)}>
                              {t('Transfer / gate pass', 'স্থানান্তর / গেট পাস', lang)}
                            </Button>,
                          );
                        }
                        if (!ended && !waitingSign) {
                          extras.push(
                            <Button key="def" size="sm" variant="ghost" className="ast-report-btn" icon={<RotateCcw size={13} />} onClick={() => setShowRejectModal(true)}>
                              {t('Report defect', 'ত্রুটি জানান', lang)}
                            </Button>,
                          );
                        }
                        if (!ended && onNavigate && assetShowsSafetyIncident(selectedAsset)) {
                          extras.push(
                            <Button
                              key="saf"
                              size="sm"
                              variant="ghost"
                              className="ast-report-btn"
                              icon={<AlertTriangle size={13} />}
                              onClick={() => {
                                queueIncidentDraft({
                                  equipment: selectedAsset.name,
                                  place: [selectedAsset.functionalLocation, selectedAsset.facility].filter(Boolean).join(', '),
                                });
                                onNavigate('incident');
                                showToast(
                                  t(`Report started for ${selectedAsset.name}. Say what happened.`, `${selectedAsset.name}-এর রিপোর্ট শুরু হয়েছে। কী ঘটেছে লিখুন।`, lang),
                                  'gold',
                                );
                              }}
                            >
                              {t('Report safety incident', 'নিরাপত্তা ঘটনা জানান', lang)}
                            </Button>,
                          );
                        }
                        if (!ended && roleConfig.canInitiateDecommission) {
                          extras.push(
                            <Button key="ret" size="sm" variant="ghost" icon={<Archive size={13} />} onClick={() => setShowDecommissionModal(true)}>
                              {t('Retire machine', 'অবসর ঘোষণা', lang)}
                            </Button>,
                          );
                        }
                        if (roleConfig.canAuthorizeWriteOff && selectedAsset.lifecycleStage === 'decommissioned' && !next.cta) {
                          extras.push(
                            <Button key="woff" size="sm" variant="gold" onClick={() => setDisposalTargetAsset(selectedAsset)}>
                              {t('Approve sale or scrap', 'বিক্রয় বা স্ক্র্যাপ অনুমোদন', lang)}
                            </Button>,
                          );
                        }
                        if (extras.length === 0) return null;
                        return (
                          <details className="ast-more">
                            <summary>{t('More actions', 'আরও কাজ', lang)}</summary>
                            <div className="ast-top-actions">{extras}</div>
                          </details>
                        );
                      })()}
                    </div>

                    <div className="eam-dossier-body">
                      {/* Active Deficiency Alert */}
                      {selectedAsset.defectQuery && (
                        <div className="inc-injury" style={{ marginBottom: 12 }}>
                          <AlertTriangle size={15} />
                          <div>
                            <strong>{selectedAsset.defectQuery.reason}:</strong> {selectedAsset.defectQuery.observation}
                            {selectedAsset.defectQuery.improvementsRequired && (
                              <div style={{ marginTop: 3, fontWeight: 600 }}>→ {selectedAsset.defectQuery.improvementsRequired}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {(assetIsPlantSide(selectedAsset) || assetServiceDue(selectedAsset) || selectedAsset.lifecycleStage === 'decommissioned' || selectedFinancials.isEconomicEoLCandidate) && (
                        <AssetLifecycleStepper asset={selectedAsset} lang={lang} />
                      )}

                      <div className="eam-subtabs">
                        <button
                          type="button"
                          className={`eam-subtab ${inspectorTab === 'overview' ? 'active' : ''}`}
                          onClick={() => setInspectorTab('overview')}
                        >
                          <Eye size={13} /> {t('About', 'পরিচিতি', lang)}
                        </button>
                        <button
                          type="button"
                          className={`eam-subtab ${inspectorTab === 'custody' ? 'active' : ''}`}
                          onClick={() => setInspectorTab('custody')}
                        >
                          <UserCheck size={13} /> {t('Who has it', 'কার কাছে', lang)}
                        </button>
                        <button
                          type="button"
                          className={`eam-subtab ${inspectorTab === 'timeline' ? 'active' : ''}`}
                          onClick={() => setInspectorTab('timeline')}
                        >
                          <History size={13} /> {t('History', 'ইতিহাস', lang)}
                        </button>
                        {!roleConfig.isSelfServiceOnly && assetShowsSpares(selectedAsset) && (
                          <button
                            type="button"
                            className={`eam-subtab ${inspectorTab === 'spares' ? 'active' : ''}`}
                            onClick={() => setInspectorTab('spares')}
                          >
                            <Package size={13} /> {t('Spare parts', 'খুচরা যন্ত্রাংশ', lang)} ({selectedAsset.spares.length})
                          </button>
                        )}
                      </div>

                      {/* SUB-TAB A: SUMMARY (each figure shown once, codes & cost breakdown behind disclosures) */}
                      {inspectorTab === 'overview' && (
                        <div>
                          <div className="ast-summary-facts">
                            <div className="eam-spec-box">
                              <div className="eam-spec-lbl">{t('Health & service', 'স্বাস্থ্য ও সার্ভিস', lang)}</div>
                              <div className="eam-spec-val">
                                {selectedAsset.lifecycleStage === 'disposed'
                                  ? t('Retired', 'অবসরপ্রাপ্ত', lang)
                                  : t(`${selectedAsset.healthScore}% good · next service ${selectedAsset.nextServiceDate}`, `${bn(selectedAsset.healthScore)}% ভালো · পরবর্তী সার্ভিস ${selectedAsset.nextServiceDate}`, lang)}
                              </div>
                              <div className="eam-spec-sub">
                                {t('Commissioned:', 'চালুর তারিখ:', lang)} {selectedAsset.commissioningDate}
                                {selectedAsset.amcVendor ? ` · AMC: ${selectedAsset.amcVendor}` : ''}
                              </div>
                            </div>

                            {roleConfig.canViewFinancialLedger && (
                              <div className="eam-spec-box">
                                <div className="eam-spec-lbl">{t('Current book value', 'বর্তমান বইমূল্য', lang)}</div>
                                <div className="eam-spec-val" style={{ color: 'var(--status-success-text)' }}>
                                  {selectedAsset.lifecycleStage === 'disposed'
                                    ? t('৳0 (retired)', '৳০ (অবসরপ্রাপ্ত)', lang)
                                    : `${fmtBdtShort(selectedFinancials.netBookValue)} (${fmtTaka(selectedFinancials.netBookValue)})`}
                                </div>
                                <div className="eam-spec-sub">
                                  {t(`Bought for ${fmtBdtShort(selectedFinancials.grossCapitalizedCost)} · drops ${fmtBdtShort(selectedFinancials.annualDepreciation)}/yr`, `ক্রয়মূল্য ${fmtBdtShort(selectedFinancials.grossCapitalizedCost)} · বার্ষিক অবচয় ${fmtBdtShort(selectedFinancials.annualDepreciation)}`, lang)}
                                </div>
                              </div>
                            )}
                          </div>

                          {selectedAsset.disposalDossier && selectedAsset.lifecycleStage === 'disposed' && (
                            <div className="eam-spec-box" style={{ marginBottom: 12 }}>
                              <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: 4 }}>
                                {t('Retirement summary', 'অবসর সারসংক্ষেপ', lang)}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                                {selectedAsset.disposalDossier.disposalMethod} · {selectedAsset.disposalDossier.buyerOrVendor} ·{' '}
                                {t('Proceeds:', 'প্রাপ্ত অর্থ:', lang)} <strong>{fmtTaka(selectedAsset.disposalDossier.salvageProceedsBdt || 0)}</strong>
                              </div>
                            </div>
                          )}

                          {roleConfig.canViewFinancialLedger && (
                            <details className="apv-ref-details" style={{ marginTop: 10 }}>
                              <summary>{t('Cost & depreciation details', 'ব্যয় ও অবচয়ের বিস্তারিত', lang)}</summary>
                              <dl className="apv-facts">
                                <div>
                                  <dt>{t('Purchase cost', 'ক্রয়মূল্য', lang)}</dt>
                                  <dd>{fmtTaka(selectedFinancials.grossCapitalizedCost)}</dd>
                                </div>
                                <div>
                                  <dt>{t('Accumulated depreciation', 'পুঞ্জীভূত অবচয়', lang)}</dt>
                                  <dd>-{fmtTaka(selectedFinancials.accumulatedDepreciation)}</dd>
                                </div>
                                <div>
                                  <dt>{t('Repairs spent so far', 'এ পর্যন্ত মেরামত খরচ', lang)}</dt>
                                  <dd>{fmtTaka(selectedAsset.cumulativeMaintenanceOpex)} ({selectedFinancials.repairToCapexRatioPct}%)</dd>
                                </div>
                                <div>
                                  <dt>{t('Total lifetime cost', 'মোট জীবনচক্র ব্যয়', lang)}</dt>
                                  <dd>{fmtTaka(selectedFinancials.totalCostOfOwnership)}</dd>
                                </div>
                                <div>
                                  <dt>{t('Expected scrap value', 'প্রত্যাশিত স্ক্র্যাপ মূল্য', lang)}</dt>
                                  <dd>{fmtTaka(selectedAsset.salvageValue)}</dd>
                                </div>
                              </dl>
                              <div style={{ marginTop: 8 }}>
                                <Button size="sm" variant="secondary" icon={<DollarSign size={13} />} onClick={() => setScheduleTargetAsset(selectedAsset)}>
                                  {t('Open yearly depreciation table', 'বার্ষিক অবচয় সারণি খুলুন', lang)}
                                </Button>
                              </div>
                            </details>
                          )}

                          <details className="apv-ref-details" style={{ marginTop: 8 }}>
                            <summary>{t('Technical & tag details', 'প্রযুক্তিগত ও ট্যাগ তথ্য', lang)}</summary>
                            <dl className="apv-facts">
                              <div><dt>{t('Asset tag', 'অ্যাসেট ট্যাগ', lang)}</dt><dd className="mono">{selectedAsset.tag}</dd></div>
                              <div><dt>{t('Register no.', 'রেজিস্টার নং', lang)}</dt><dd className="mono">{selectedAsset.sapAssetNo}</dd></div>
                              <div><dt>{t('Serial no.', 'সিরিয়াল নং', lang)}</dt><dd className="mono">{selectedAsset.serialNo}</dd></div>
                              <div><dt>{t('Maker & model', 'প্রস্তুতকারক ও মডেল', lang)}</dt><dd>{selectedAsset.oem} ({selectedAsset.modelNo})</dd></div>
                              <div><dt>{t('Cost center', 'কস্ট সেন্টার', lang)}</dt><dd className="mono">{selectedAsset.glCostCenter}</dd></div>
                              <div>
                                <dt>{t('Criticality', 'গুরুত্ব শ্রেণী', lang)}</dt>
                                <dd>{selectedAsset.criticality === 'critical_a' ? 'Class A (Critical)' : selectedAsset.criticality === 'essential_b' ? 'Class B (Essential)' : 'Class C (Standard)'}</dd>
                              </div>
                            </dl>
                            <div style={{ marginTop: 8 }}>
                              <Button size="sm" variant="secondary" icon={<QrCode size={13} />} onClick={() => setShowPassportModal(true)}>
                                {t('Open QR passport', 'কিউআর পাসপোর্ট খুলুন', lang)}
                              </Button>
                            </div>
                          </details>
                        </div>
                      )}
                      {/* SUB-TAB B: HISTORY */}
                      {inspectorTab === 'timeline' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                          {selectedAsset.lifecycleEvents.map((ev) => (
                            <div
                              key={ev.id}
                              className="eam-spec-box"
                              style={{ borderLeft: '3px solid var(--brand-crimson)' }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-1)' }}>{ev.title}</span>
                                  {typeof ev.financialDeltaBdt === 'number' && ev.financialDeltaBdt !== 0 && (
                                    <StatusPill tone={ev.financialDeltaBdt > 0 ? 'info' : 'warn'}>
                                      {ev.financialDeltaBdt > 0 ? `+${fmtTaka(ev.financialDeltaBdt)}` : fmtTaka(ev.financialDeltaBdt)}
                                    </StatusPill>
                                  )}
                                </div>
                                <span style={{ fontSize: '11.5px', color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Clock size={11} /> {ev.timestamp}
                                </span>
                              </div>

                              <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px', lineHeight: 1.45 }}>
                                {ev.notes}
                              </div>

                              <div style={{ fontSize: '11.5px', color: 'var(--text-3)', marginTop: '6px' }}>
                                {t('By', 'সম্পাদনকারী:', lang)} <strong>{ev.actor}</strong> ({ev.actorRole})
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* SUB-TAB C: CUSTODY */}
                      {inspectorTab === 'custody' && (
                        <div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '12px' }}>
                            {selectedAsset.custodyHistory.map((ch) => {
                              const isCurrent = !ch.returnedDate;
                              return (
                                <div
                                  key={ch.id}
                                  className="eam-spec-box"
                                  style={{
                                    border: isCurrent ? '1.5px solid var(--status-success-border)' : undefined,
                                    background: isCurrent ? 'var(--status-success-bg)' : undefined,
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                    <strong style={{ fontSize: '13px' }}>{ch.custodianName}</strong>
                                    <StatusPill tone={isCurrent ? 'success' : 'info'}>
                                      {isCurrent ? t('Current holder', 'বর্তমান হেফাজতকারী', lang) : `${t('Returned', 'ফেরত', lang)} ${ch.returnedDate}`}
                                    </StatusPill>
                                  </div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '3px' }}>
                                    {ch.facility} · {ch.functionalLocation} ({ch.department})
                                  </div>
                                  <div style={{ fontSize: '11.5px', color: 'var(--text-3)', marginTop: '4px' }}>
                                    {t('Assigned:', 'বরাদ্দ:', lang)} <strong>{ch.assignedDate}</strong>
                                    {' · '}
                                    {ch.acknowledged ? (
                                      <span style={{ color: 'var(--status-success-text)', fontWeight: 700 }}>
                                        {t('Signed', 'স্বাক্ষরিত', lang)} {ch.acknowledgedAt ? `(${ch.acknowledgedAt})` : ''}
                                      </span>
                                    ) : (
                                      <span style={{ color: 'var(--status-warning-text)', fontWeight: 700 }}>{t('Awaiting signature', 'স্বাক্ষর বাকি', lang)}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {roleConfig.canTransferCustody &&
                            selectedAsset.lifecycleStage !== 'disposed' &&
                            selectedAsset.lifecycleStage !== 'decommissioned' && (
                              <Button block icon={<ArrowRightLeft size={14} />} onClick={() => setShowTransferModal(true)}>
                                {t('Transfer to another custodian or site', 'অন্য কর্মকর্তা বা স্থাপনায় হস্তান্তর করুন', lang)}
                              </Button>
                            )}
                        </div>
                      )}

                      {/* SUB-TAB D: SPARE PARTS */}
                      {inspectorTab === 'spares' && assetShowsSpares(selectedAsset) && (
                        <div>
                          {selectedAsset.spares.length === 0 ? (
                            <EmptyState
                              compact
                              icon={<Package size={18} />}
                              title={t('No spare parts registered for this item', 'এই সরঞ্জামের জন্য আলাদা খুচরা যন্ত্রাংশ নেই', lang)}
                            />
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                              {selectedAsset.spares.map((sp) => {
                                const isLow = sp.stockQty <= sp.minReorderQty;
                                return (
                                  <div
                                    key={sp.id}
                                    className="eam-spec-box"
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      flexWrap: 'wrap',
                                      gap: '10px',
                                    }}
                                  >
                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-1)' }}>{sp.name}</div>
                                      <div style={{ fontSize: '11.5px', color: 'var(--text-3)', marginTop: '2px' }}>
                                        {t('Unit cost:', 'একক মূল্য:', lang)} {fmtTaka(sp.unitCostBdt)} · {t(`Lead time ${sp.leadTimeDays}d`, `সরবরাহ সময় ${bn(sp.leadTimeDays)} দিন`, lang)}
                                      </div>
                                      <div style={{ marginTop: '5px' }}>
                                        <StatusPill tone={isLow ? 'danger' : 'success'}>
                                          {t(`${sp.stockQty} in stock`, `${bn(sp.stockQty)}টি মজুদ`, lang)}{isLow ? ` · ${t('Reorder needed', 'পুনরায় অর্ডার দিন', lang)}` : ''}
                                        </StatusPill>
                                      </div>
                                    </div>

                                    {roleConfig.canManageWorkOrders && (
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          disabled={sp.stockQty <= 0}
                                          onClick={() => {
                                            consumeSparePart(selectedAsset.id, sp.id, currentPersona.name, currentPersona.label);
                                            showToast(t(`Issued 1 × ${sp.name}.`, '১টি খুচরা যন্ত্রাংশ ইস্যু করা হয়েছে।', lang), 'info');
                                          }}
                                        >
                                          {t('Issue 1', '১টি দিন', lang)}
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            restockSparePart(selectedAsset.id, sp.id, 3);
                                            showToast(t(`Restocked +3 of ${sp.name}.`, 'স্টোরে +৩টি যন্ত্রাংশ যুক্ত হয়েছে।', lang), 'success');
                                          }}
                                        >
                                          {t('+3 restock', '+৩টি মজুদ', lang)}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: PREVENTIVE, CORRECTIVE & STATUTORY CALIBRATION WORK ORDERS
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'maintenance' && (
        <div className="card">
          <div className="card-hd" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div className="card-hd-left">
              <div className="card-hd-icon"><Wrench size={16} /></div>
              <div>
                <div className="card-title">
                  {t('Machine Repairs & Scheduled Servicing', 'যন্ত্রপাতি মেরামত ও নিয়মিত সার্ভিসিং', lang)}
                </div>
                <div className="card-subtitle">
                  {t('Track ongoing repair work orders, scheduled safety inspections, and manufacturer warranty.', 'চলমান মেরামত কাজ, নিয়মিত সেফটি ইন্সপেকশন এবং ওয়ারেন্টি ট্র্যাকিং।', lang)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="eam-cat-chips">
                <button
                  type="button"
                  className={`eam-cat-chip ${woFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setWoFilter('all')}
                >
                  {t('All', 'সকল', lang)} <span className="eam-cat-chip-count">{baseWorkOrders.length}</span>
                </button>
                <button
                  type="button"
                  className={`eam-cat-chip ${woFilter === 'open' ? 'active' : ''}`}
                  onClick={() => setWoFilter('open')}
                >
                  {t('Open / Due', 'চলমান', lang)}{' '}
                  <span className="eam-cat-chip-count">{baseWorkOrders.filter((w) => w.status !== 'completed').length}</span>
                </button>
                <button
                  type="button"
                  className={`eam-cat-chip ${woFilter === 'cal' ? 'active' : ''}`}
                  onClick={() => setWoFilter('cal')}
                >
                  {t('Statutory CAL', 'ক্যালিব্রেশন', lang)}
                </button>
                <button
                  type="button"
                  className={`eam-cat-chip ${woFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setWoFilter('completed')}
                >
                  ✓ {t('Certified', 'প্রত্যয়িত', lang)}
                </button>
              </div>

              {roleConfig.canManageWorkOrders && (
                <button type="button" className="btn-primary" onClick={() => setShowWorkOrderModal(true)}>
                  <Plus size={14} /> {t('New Work Order', 'নতুন কার্যাদেশ', lang)}
                </button>
              )}
            </div>
          </div>

          <div className="card-body">
            <div className="eam-search-box" style={{ marginBottom: '14px', maxWidth: '420px' }}>
              <Search size={14} className="eam-search-icon" />
              <input
                type="text"
                className="eam-search-input"
                placeholder={t('Filter work orders by WO#, asset tag, title, or engineer...', 'কার্যাদেশ নম্বর, ট্যাগ বা প্রকৌশলীর নাম খুঁজুন...', lang)}
                value={woSearch}
                onChange={(e) => setWoSearch(e.target.value)}
              />
              {woSearch && (
                <button type="button" className="eam-search-clear" onClick={() => setWoSearch('')}>
                  <X size={12} />
                </button>
              )}
            </div>

            {visibleWorkOrders.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--brand-slate-400)', fontSize: '12.5px' }}>
                {t('No maintenance or calibration work orders match this filter.', 'কোনো রক্ষণাবেক্ষণ কার্যাদেশ পাওয়া যায়নি।', lang)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {visibleWorkOrders.map((wo) => (
                  <div
                    key={wo.id}
                    className="eam-spec-box"
                    style={{
                      borderLeft: `4px solid ${
                        wo.status === 'completed'
                          ? 'var(--status-success)'
                          : wo.priority === 'critical'
                          ? 'var(--status-danger)'
                          : 'var(--status-warning)'
                      }`,
                      background: 'var(--brand-card-bg)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '14px',
                      padding: '13px 16px',
                    }}
                  >
                    <div style={{ flex: '1 1 360px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', marginBottom: '5px' }}>
                        <span className="eam-tag-mono">{wo.woNumber}</span>
                        <span className={`badge ${wo.type === 'CAL' ? 'danger' : wo.type === 'CM' ? 'warn' : 'info'}`}>
                          {wo.type}
                        </span>
                        <button
                          type="button"
                          className="eam-preset-chip"
                          style={{ padding: '2px 8px', fontFamily: 'monospace' }}
                          onClick={() => inspectAssetInCockpit(wo.assetId)}
                          title="Inspect asset in 360° Cockpit"
                        >
                          {wo.assetTag} <ExternalLink size={10} style={{ display: 'inline', marginLeft: '2px' }} />
                        </button>
                        {wo.lotoPermitRef && (
                          <span className="badge danger" style={{ fontSize: '10px' }}>{wo.lotoPermitRef}</span>
                        )}
                        {wo.coveredByWarranty && (
                          <span className="badge success" style={{ fontSize: '10px' }}>OEM Warranty (৳0)</span>
                        )}
                        {wo.isCapexOverhaul && (
                          <span className="badge gold" style={{ fontSize: '10px' }}>Capitalized Overhaul</span>
                        )}
                      </div>

                      <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--brand-slate-900)' }}>{wo.title}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '3px' }}>
                        Equipment: <strong>{wo.assetName}</strong> • Assigned: <strong>{wo.assignedEngineer}</strong>
                        {wo.regulatoryBody ? ` • Authority: ${wo.regulatoryBody}` : ''}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', marginTop: '3px' }}>
                        {wo.remarks}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '7px' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: 'var(--brand-slate-900)' }}>
                          {wo.coveredByWarranty ? '৳0 (Warranty)' : `৳${wo.estimatedCostBdt.toLocaleString()}`}
                        </strong>
                        <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>
                          {wo.status === 'completed' ? `Certified: ${wo.completedDate}` : `Due: ${wo.dueDate}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ padding: '5px 10px', fontSize: '11px' }}
                          onClick={() => inspectAssetInCockpit(wo.assetId)}
                        >
                          <Eye size={12} /> {t('360° Dossier', 'ডসিয়ার', lang)}
                        </button>

                        {wo.status === 'completed' ? (
                          <span className="badge success">
                            <CheckCircle size={11} /> {wo.certificateNo || 'Certified'}
                          </span>
                        ) : roleConfig.canManageWorkOrders || roleConfig.canCertifyCalibration ? (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '11.5px' }}
                            onClick={() => {
                              completeWorkOrder(wo.id, currentPersona.name, currentPersona.label);
                              showToast(
                                t(
                                  `✓ Certified ${wo.woNumber} (${wo.assetTag}) & appended to Lifetime Ledger!`,
                                  `✓ কার্যাদেশ ${wo.woNumber} সফলভাবে প্রত্যয়ন করা হয়েছে!`,
                                  lang
                                ),
                                'success'
                              );
                            }}
                          >
                            <CheckCircle size={13} /> {t('Certify & Complete', 'প্রত্যয়ন ও সম্পন্ন', lang)}
                          </button>
                        ) : (
                          <span className="badge warn">{t('In Progress', 'প্রক্রিয়াধীন', lang)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: FIXED ASSET VALUATION, DEPRECIATION & LIFETIME COST LEDGER
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'financials' && roleConfig.canViewFinancialLedger && (
        <div className="card">
          <div className="card-hd" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div className="card-hd-left">
              <div className="card-hd-icon"><DollarSign size={16} /></div>
              <div>
                <div className="card-title">
                  {t('Machinery Valuation & Yearly Value Drop', 'যন্ত্রপাতির মূল্যায়ন ও বার্ষিক অবচয় হিসাব', lang)}
                </div>
                <div className="card-subtitle">
                  {t(
                    'Current book value, yearly depreciation, and total repair expenses compared to purchase cost.',
                    'যন্ত্রপাতির বর্তমান আর্থিক মূল্য, বার্ষিক অবচয় এবং মোট মেরামত ব্যয়ের হিসাব।',
                    lang
                  )}
                </div>
              </div>
            </div>

            <button type="button" className="btn-primary" onClick={handleExportMasterLedgerCsv}>
              <Download size={14} /> {t('Export Financial Ledger (CSV)', 'আর্থিক খতিয়ান ডাউনলোড (CSV)', lang)}
            </button>
          </div>

          {/* Portfolio Financial Summary Strip */}
          <div
            style={{
              padding: '12px 18px',
              background: 'var(--brand-canvas)',
              borderBottom: '1px solid var(--brand-slate-200)',
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              fontSize: '12px',
            }}
          >
            <span>
              <strong>Active Capital Base:</strong> {fmtTaka(portfolioStats.totalGross)}
            </span>
            <span>
              <strong>Accumulated Depreciation:</strong>{' '}
              <span style={{ color: 'var(--status-danger)', fontWeight: 700 }}>-{fmtTaka(portfolioStats.totalAccDep)}</span>
            </span>
            <span>
              <strong>Current Book Value:</strong>{' '}
              <span style={{ color: 'var(--status-success)', fontWeight: 800 }}>{fmtTaka(portfolioStats.totalNbv)}</span>
            </span>
            <span>
              <strong>Total Cost (CAPEX + OPEX):</strong> {fmtTaka(portfolioStats.totalTco)}
            </span>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('Asset Tag & Financial Code', 'ট্যাগ ও আর্থিক কোড', lang)}</th>
                    <th>{t('Cost Center', 'কস্ট সেন্টার', lang)}</th>
                    <th>{t('Purchase Cost', 'মূলধন ক্রয় ব্যয়', lang)}</th>
                    <th>{t('Depreciation Method & Rate', 'পদ্ধতি ও বার্ষিক অবচয়', lang)}</th>
                    <th>{t('Accumulated Dep.', 'পুঞ্জীভূত অবচয়', lang)}</th>
                    <th>{t('Current Book Value', 'বর্তমান বইমূল্য', lang)}</th>
                    <th>{t('Total Cost & Repair Ratio', 'মোট ব্যয় ও মেরামত %', lang)}</th>
                    <th style={{ textAlign: 'right' }}>{t('Actions', 'পদক্ষেপ', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {roleScopedAssets.map((a) => {
                    const f = calculateAssetFinancials(a);
                    const ratioBarColor =
                      f.repairToCapexRatioPct >= 50 ? 'var(--status-danger)' : f.repairToCapexRatioPct >= 30 ? 'var(--status-warning)' : 'var(--status-success)';

                    return (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--brand-slate-900)' }}>{a.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span className="eam-tag-mono">{a.tag}</span>
                            <span style={{ fontSize: '10.5px', fontFamily: 'monospace', color: 'var(--brand-slate-500)' }}>
                              {a.sapAssetNo}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: '11.5px', fontWeight: 700 }}>{a.glCostCenter}</span>
                          <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>
                            Age: {a.ageYears}/{a.usefulLifeYears}y
                          </div>
                        </td>
                        <td style={{ fontWeight: 700 }}>{fmtTaka(f.grossCapitalizedCost)}</td>
                        <td>
                          <span className="badge info" style={{ fontSize: '10px' }}>{a.depreciationMethod}</span>
                          <div style={{ fontSize: '11px', color: 'var(--status-danger)', marginTop: '2px', fontWeight: 600 }}>
                            -{fmtTaka(f.annualDepreciation)}/yr
                          </div>
                        </td>
                        <td>{fmtTaka(f.accumulatedDepreciation)}</td>
                        <td style={{ fontWeight: 800, color: a.lifecycleStage === 'disposed' ? 'var(--brand-slate-400)' : 'var(--status-success)' }}>
                          {a.lifecycleStage === 'disposed' ? '৳0 (Retired)' : `৳${f.netBookValue.toLocaleString()}`}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{fmtTaka(f.totalCostOfOwnership)}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                            <div className="eam-mini-bar" style={{ width: '54px' }}>
                              <div
                                className="eam-mini-bar-fill"
                                style={{
                                  width: `${Math.min(100, f.repairToCapexRatioPct * 1.4)}%`,
                                  background: ratioBarColor,
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '10.5px', fontWeight: 700, color: ratioBarColor }}>
                              {f.repairToCapexRatioPct}% {f.repairToCapexRatioPct >= 50 ? 'EoL' : ''}
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '5px' }}>
                            <button
                              type="button"
                              className="btn-outline"
                              style={{ fontSize: '11px', padding: '5px 9px' }}
                              onClick={() => setScheduleTargetAsset(a)}
                            >
                              {t('Schedule', 'তফসিল', lang)}
                            </button>
                            <button
                              type="button"
                              className="btn-sm-ghost"
                              style={{ fontSize: '11px', padding: '5px 8px' }}
                              onClick={() => inspectAssetInCockpit(a.id)}
                              title="Open in 360° Cockpit"
                            >
                              <Eye size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: ASSET ACQUISITION REQUISITIONS & CHAIN-OF-CUSTODY TRANSFERS
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'transfers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* PART A: Stage 1-3 Acquisition Requisitions */}
          <div className="card">
            <div className="card-hd" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <div className="card-hd-left">
                <div className="card-hd-icon"><FilePlus size={16} /></div>
                <div>
                  <div className="card-title">
                    {t('Equipment Purchase & Replacement Requests', 'নতুন যন্ত্রপাতি ক্রয় ও প্রতিস্থাপন আবেদন', lang)}
                  </div>
                  <div className="card-subtitle">
                    {t('Track approval pipeline from request to purchase, safety inspection, and delivery.', 'অনুরোধ হতে বিভাগীয় অনুমোদন, ক্রয় এবং স্থাপনা হস্তান্তরের সার্বিক ট্র্যাকিং।', lang)}
                  </div>
                </div>
              </div>
              {roleConfig.canRequestEquipment && (
                <button type="button" className="btn-primary" onClick={() => setShowRequisitionModal(true)}>
                  <Plus size={14} /> {t('New Equipment Request', 'নতুন আবেদন দাখিল', lang)}
                </button>
              )}
            </div>

            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                {visibleRequisitions.map((req) => {
                  const step1Done = req.stage !== 'pending_hod' && req.stage !== 'rejected';
                  const step2Done = req.stage === 'approved_procuring' || req.stage === 'commissioned';
                  const step3Done = req.stage === 'commissioned';

                  return (
                    <div
                      key={req.id}
                      className="eam-spec-box"
                      style={{
                        background: 'var(--brand-card-bg)',
                        padding: '14px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '14px',
                      }}
                    >
                      <div style={{ flex: '1 1 380px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span className="eam-tag-mono">{req.reqNumber}</span>
                          <span className={`badge ${req.urgency === 'critical' ? 'danger' : req.urgency === 'high' ? 'warn' : 'info'}`}>
                            {req.urgency.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-gold-dark)' }}>
                            Est. CAPEX: {fmtTaka(req.estimatedCapexBdt)}
                          </span>
                        </div>

                        <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--brand-slate-900)' }}>{req.title}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                          Requester: <strong>{req.requestedBy}</strong> ({req.department}) • Deployment: <strong>{req.facility}</strong>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', marginTop: '3px' }}>
                          {req.justification}
                        </div>
                        {req.attachments && req.attachments.length > 0 && (
                          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '3px' }}>
                            {t('Attached', 'সংযুক্ত', lang)}: {req.attachments.map((file) => file.name).join(', ')}
                          </div>
                        )}

                        {/* Visual 3-Step Approval Progress Pills */}
                        <div className="eam-req-steps">
                          <span className={`eam-req-step ${step1Done ? 'done' : req.stage === 'pending_hod' ? 'current' : ''}`}>
                            {step1Done ? '✓' : '1.'} {t('Dept Vetting', 'বিভাগীয় যাচাই', lang)}
                          </span>
                          <span style={{ color: 'var(--brand-slate-300)', fontSize: '11px' }}>➔</span>
                          <span className={`eam-req-step ${step2Done ? 'done' : req.stage === 'pending_executive' ? 'current' : ''}`}>
                            {step2Done ? '✓' : '2.'} {t('CFO / Chairman Sanction', 'বাজেট অনুমোদন', lang)}
                          </span>
                          <span style={{ color: 'var(--brand-slate-300)', fontSize: '11px' }}>➔</span>
                          <span className={`eam-req-step ${step3Done ? 'done' : req.stage === 'approved_procuring' ? 'current' : ''}`}>
                            {step3Done ? '✓' : '3.'} {t('GRN & Tag Minted', 'ট্যাগ ও কমিশনিং', lang)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '7px' }}>
                        {req.stage === 'commissioned' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                            <span className="badge success" style={{ fontSize: '11px' }}>
                              ✓ Commissioned: {req.mintedAssetTag}
                            </span>
                            {req.mintedAssetTag && (
                              <button
                                type="button"
                                className="btn-outline"
                                style={{ fontSize: '11px', padding: '5px 10px' }}
                                onClick={() => {
                                  const found = assets.find((a) => a.tag === req.mintedAssetTag);
                                  if (found) inspectAssetInCockpit(found.id);
                                }}
                              >
                                <Eye size={12} /> {t('Open in 360° Cockpit', '৩৬০° ডসিয়ারে দেখুন', lang)}
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            {roleConfig.canApproveRequisition ? (
                              <button
                                type="button"
                                className={req.stage === 'pending_executive' ? 'btn-gold' : 'btn-primary'}
                                style={{ padding: '7px 14px', fontSize: '12px', fontWeight: 800 }}
                                onClick={() => {
                                  const res = advanceRequisition(req.id, currentPersona.name, currentPersona.label);
                                  if (res.mintedAsset) {
                                    setSelectedAssetId(res.mintedAsset.id);
                                    showToast(
                                      t(
                                        `🎉 GRN Completed! Minted Asset Tag ${res.mintedAsset.tag} (${res.mintedAsset.sapAssetNo}) into live register!`,
                                        `🎉 সম্পদ ট্যাগ ${res.mintedAsset.tag} সফলভাবে কমিশনিং ও রেজিস্টারে যুক্ত হয়েছে!`,
                                        lang
                                      ),
                                      'gold'
                                    );
                                  } else {
                                    showToast(
                                      t(`✓ Advanced ${req.reqNumber} to next governance stage.`, `✓ ${req.reqNumber} পরবর্তী ধাপে অনুমোদিত হয়েছে।`, lang),
                                      'success'
                                    );
                                  }
                                }}
                              >
                                {req.stage === 'pending_hod'
                                  ? t('Endorse & Forward →', 'সুপারিশ ও প্রেরণ →', lang)
                                  : req.stage === 'pending_executive'
                                  ? t('Sanction CAPEX Budget', 'বাজেট চূড়ান্ত অনুমোদন', lang)
                                  : t('✓ Receive GRN & Mint Asset Tag', '✓ গ্রহণ ও অ্যাসেট ট্যাগ তৈরি', lang)}
                              </button>
                            ) : (
                              <span className="badge info">{t('Awaiting Approval Authority', 'অনুমোদন প্রক্রিয়াধীন', lang)}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* PART B: Stage 5 Inter-Site & Custodian Transit Ledger */}
          {!roleConfig.isSelfServiceOnly && (
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon"><ArrowRightLeft size={16} /></div>
                  <div>
                    <div className="card-title">{t('Stage-5 Inter-Site & Custodian Transit Gate Pass Ledger', 'আন্তঃস্থাপনা ও হেফাজত স্থানান্তর গেট পাস খতিয়ান', lang)}</div>
                    <div className="card-subtitle">{t('Auditable physical & custodial movement history across Keraniganj, Baridhara HQ & Chattogram', 'কারখানা, সদর দপ্তর ও টার্মিনালের মধ্যে সম্পদ স্থানান্তরের পূর্ণ ইতিহাস', lang)}</div>
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {transfers.map((trf) => (
                    <div
                      key={trf.id}
                      className="eam-spec-box"
                      style={{
                        background: 'var(--brand-card-bg)',
                        padding: '13px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div style={{ flex: '1 1 360px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="eam-tag-mono">{trf.transferRef}</span>
                          <span className="badge info" style={{ fontFamily: 'monospace' }}>Gate Pass: {trf.gatePassNo}</span>
                          <strong style={{ fontSize: '13px', color: 'var(--brand-slate-900)' }}>
                            {trf.assetTag} — {trf.assetName}
                          </strong>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-600)', marginTop: '5px' }}>
                          <strong>From:</strong> {trf.fromCustodian} ({trf.fromFacility}) ➔ <strong>To:</strong> {trf.toCustodian} ({trf.toFacility} · {trf.toLocation})
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', marginTop: '2px' }}>
                          Reason: {trf.reason} • Initiated: {trf.initiatedAt}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ fontSize: '11px', padding: '5px 10px' }}
                          onClick={() => inspectAssetInCockpit(trf.assetId)}
                        >
                          <Eye size={12} /> {t('360° Dossier', 'ডসিয়ার', lang)}
                        </button>

                        {trf.status === 'completed' ? (
                          <span className="badge success">✓ {t('Completed', 'সম্পন্ন', lang)} ({trf.completedAt})</span>
                        ) : !canReceiveTransfer(trf) ? (
                          <span className="badge info">{t('In transit', 'স্থানান্তরধীন', lang)}</span>
                        ) : (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ fontSize: '11.5px', padding: '6px 12px' }}
                            onClick={() => {
                              completeTransfer(trf.id, currentPersona.name, currentPersona.label);
                              showToast(
                                t(
                                  `✓ Gate Pass ${trf.gatePassNo} closed! ${trf.assetTag} received at ${trf.toFacility}.`,
                                  `✓ গেট পাস ${trf.gatePassNo} সম্পন্ন! সম্পদ নতুন হেফাজতকারীর নিকট হস্তান্তরিত।`,
                                  lang
                                ),
                                'success'
                              );
                            }}
                          >
                            <CheckCircle size={13} /> {t('Confirm Arrival & Receive', 'প্রাপ্তি নিশ্চিত করুন', lang)}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5: STAGE 7 & 8 CONDEMNATION, WRITE-OFF & 10-YR STATUTORY ARCHIVE
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'disposal' && !roleConfig.isSelfServiceOnly && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* STAGE 7: Pending Condemnation & Pre-Disposal Checklist */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-hd-icon"><ShieldAlert size={16} /></div>
                <div>
                  <div className="card-title">{t('Worn-Out Machinery Pending Final Retirement', 'অকেজো যন্ত্রপাতি ও চূড়ান্ত অবসর অনুমোদন', lang)}</div>
                  <div className="card-subtitle">
                    {t(
                      'Mandatory 4-point verification before selling or scrapping (Engineering Survey, Decontamination, Spares Harvest, Accounts Sign-Off).',
                      'নিলাম বা স্ক্র্যাপ করার পূর্বে ৪-দফা কারিগরি, নিরাপত্তা ও আর্থিক ছাড়পত্র।',
                      lang
                    )}
                  </div>
                </div>
              </div>
              <span className="badge danger">{decommissionedAssets.length} {t('Pending Write-Off', 'অবলোপন বাকি', lang)}</span>
            </div>

            <div className="card-body">
              {decommissionedAssets.length === 0 ? (
                <div style={{ padding: '28px', textAlign: 'center', color: 'var(--brand-slate-400)', fontSize: '12.5px' }}>
                  ✓ {t('No condemned assets currently awaiting write-off authorization.', 'বর্তমানে কোনো অকেজো সম্পদ অবলোপনের অপেক্ষায় নেই।', lang)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {decommissionedAssets.map((a) => {
                    const fin = calculateAssetFinancials(a);
                    const cl = a.disposalDossier?.checklist;
                    const checksList = [
                      ['technicalSurveySigned', '1. Engineering Condemnation Survey'],
                      ['decontaminationOrDataWipeCertified', '2. DoE Gas-Free / NIST 800-88 Wipe'],
                      ['sparesHarvested', '3. Reusable BOM Spares Harvested'],
                      ['financeCfoVetted', '4. CFO Fixed-Asset Ledger Audit'],
                    ] as const;

                    const verifiedCount = cl
                      ? checksList.filter(([k]) => cl[k]).length
                      : 0;
                    const allChecked = verifiedCount === 4;

                    return (
                      <div
                        key={a.id}
                        className="eam-spec-box"
                        style={{
                          border: '1.5px solid rgba(220, 38, 38, 0.35)',
                          background: 'var(--brand-card-bg)',
                          padding: '15px 18px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                          <div style={{ flex: '1 1 360px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span className="eam-tag-mono">{a.tag}</span>
                              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--brand-slate-500)' }}>
                                {a.sapAssetNo}
                              </span>
                              <span className="badge danger">{a.disposalDossier?.reason}</span>
                              <span className={`badge ${allChecked ? 'success' : 'warn'}`}>
                                {verifiedCount}/4 {t('Checks Verified', 'যাচাই সম্পন্ন', lang)}
                              </span>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '14px', marginTop: '4px', color: 'var(--brand-slate-900)' }}>{a.name}</div>
                            <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                              {a.disposalDossier?.surveyNotes}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', fontSize: '12px' }}>
                            <div>Orig. CAPEX: <strong>{fmtTaka(fin.grossCapitalizedCost)}</strong></div>
                            <div>Carrying NBV: <strong style={{ color: 'var(--status-danger)' }}>{fmtTaka(fin.netBookValue)}</strong></div>
                            <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>
                              Survey by: {a.disposalDossier?.initiatedBy}
                            </div>
                          </div>
                        </div>

                        {/* Interactive 4-Point Checklist + 1-Click Verify All */}
                        {cl && (
                          <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(225px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                              {checksList.map(([key, label]) => {
                                const checked = cl[key];
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => toggleDisposalChecklistItem(a.id, key)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '9px 11px',
                                      borderRadius: '8px',
                                      border: checked ? '1.5px solid rgba(5, 150, 105, 0.4)' : '1px solid var(--brand-slate-200)',
                                      background: checked ? 'rgba(5, 150, 105, 0.09)' : 'var(--brand-canvas)',
                                      color: checked ? 'var(--status-success)' : 'var(--brand-slate-600)',
                                      fontSize: '11.5px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      fontFamily: 'inherit',
                                    }}
                                  >
                                    {checked ? <CheckSquare size={15} /> : <Square size={15} />}
                                    <span>{label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                            Segregation of Duties: Final balance-sheet write-off requires <strong>Chairman & MD</strong> or <strong>CFO / Head of Finance</strong> sanction.
                          </span>

                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn-outline"
                              style={{ fontSize: '11.5px', padding: '6px 11px' }}
                              onClick={() => inspectAssetInCockpit(a.id)}
                            >
                              <Eye size={13} /> {t('360° Dossier', 'ডসিয়ার', lang)}
                            </button>

                            {cl && !allChecked && (
                              <button
                                type="button"
                                className="btn-outline"
                                style={{ fontSize: '11.5px', padding: '6px 11px' }}
                                onClick={() => {
                                  checksList.forEach(([k]) => {
                                    if (!cl[k]) toggleDisposalChecklistItem(a.id, k);
                                  });
                                  showToast(t('All 4 pre-disposal safety & audit checks verified.', 'সকল ৪টি প্রাক-অবলোপন যাচাই সম্পন্ন।', lang), 'info');
                                }}
                              >
                                <CheckSquare size={13} /> {t('Verify All 4 Checks', 'সবগুলো যাচাই সম্পন্ন করুন', lang)}
                              </button>
                            )}

                            {roleConfig.canAuthorizeWriteOff ? (
                              <button
                                type="button"
                                className="btn-gold"
                                style={{ fontWeight: 800 }}
                                onClick={() => {
                                  if (!allChecked) {
                                    showToast(
                                      t('Please verify all 4 mandatory pre-disposal safety & audit checks first.', 'অনুগ্রহ করে প্রথমে ৪টি প্রাক-অবলোপন চেকলিস্ট নিশ্চিত করুন।', lang),
                                      'warn'
                                    );
                                    return;
                                  }
                                  setDisposalTargetAsset(a);
                                }}
                              >
                                {t('Authorize Write-Off & Execute Disposal', 'চূড়ান্ত অবলোপন ও নিলাম নিষ্পত্তি', lang)}
                              </button>
                            ) : (
                              <span className="badge warn">Awaiting CFO / Chairman Write-Off Sanction</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* STAGE 8: Disposed & Retired 10-Year Statutory Archive */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-hd-icon"><Archive size={16} /></div>
                <div>
                  <div className="card-title">{t('Stage-8 Disposed & Retired Statutory Archive (10-Year Retention)', 'পর্যায়-৮: নিষ্পত্তিকৃত ও নিলামকৃত সম্পদের সংবিধিবদ্ধ আর্কাইভ', lang)}</div>
                  <div className="card-subtitle">{t('Immutable historical records retained for NBR Tax, Customs & DoE Regulatory Audits — Never Hard-Deleted', 'আয়কর, ভ্যাট ও সরকারি নিরীক্ষার জন্য অপরিবর্তনীয় ঐতিহাসিক দলিল সংরক্ষিত', lang)}</div>
                </div>
              </div>
              <span className="badge info">{disposedAssets.length} Archived</span>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('Retired Tag & Title', 'ট্যাগ ও সম্পদের নাম', lang)}</th>
                      <th>{t('Disposal Channel & Buyer', 'নিষ্পত্তির মাধ্যম ও ক্রেতা', lang)}</th>
                      <th>{t('NBV at Retirement', 'অবলোপনকালীন বইমূল্য', lang)}</th>
                      <th>{t('Realized Proceeds', 'প্রাপ্ত নিলাম/স্ক্র্যাপ মূল্য', lang)}</th>
                      <th>{t('IAS 16 Gain / Loss', 'লাভ / ক্ষতি (IAS 16)', lang)}</th>
                      <th>{t('Retirement Voucher', 'অবলোপন ভাউচার ও অনুমোদনকারী', lang)}</th>
                      <th style={{ textAlign: 'right' }}>{t('Audit File', 'নথি', lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disposedAssets.map((a) => {
                      const d = a.disposalDossier;
                      const gl = d?.gainOrLossBdt || 0;
                      return (
                        <tr key={a.id}>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--brand-slate-900)' }}>{a.name}</div>
                            <div style={{ fontSize: '10.5px', fontFamily: 'monospace', color: 'var(--brand-slate-500)' }}>
                              {a.tag} • {a.sapAssetNo}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '12px' }}>{d?.disposalMethod}</div>
                            <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>{d?.buyerOrVendor}</div>
                          </td>
                          <td>{fmtTaka((d?.netBookValueAtDisposal || 0))}</td>
                          <td style={{ fontWeight: 700 }}>{fmtTaka((d?.salvageProceedsBdt || 0))}</td>
                          <td>
                            <span className={`badge ${gl >= 0 ? 'success' : 'danger'}`} style={{ fontWeight: 800 }}>
                              {gl >= 0 ? `+৳${gl.toLocaleString()} Gain` : `-৳${Math.abs(gl).toLocaleString()} Loss`}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '11.5px', color: 'var(--status-info)' }}>
                              {d?.sapRetirementVoucher}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--brand-slate-400)' }}>
                              {d?.authorizedBy} • {d?.disposedDate}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn-outline"
                              style={{ fontSize: '11px', padding: '5px 10px' }}
                              onClick={() => inspectAssetInCockpit(a.id)}
                            >
                              <Eye size={12} /> {t('360° Record', 'রেকর্ড দেখুন', lang)}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ALL INTERACTIVE LIFECYCLE MODALS
          ══════════════════════════════════════════════════════════════════════ */}
      <RegisterAssetModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        role={role}
        lang={lang}
        onRegister={(input) => {
          const created = registerAsset(input);
          setSelectedAssetId(created.id);
          setActiveTab('register');
          setViewMode('cockpit');
          showToast(
            t(
              `✓ Asset ${created.tag} (${created.sapAssetNo}) registered with QR passport.`,
              `✓ সম্পদ ${created.tag} সফলভাবে এসএপিতে নিবন্ধিত হয়েছে!`,
              lang
            ),
            'success'
          );
        }}
      />

      <TransferAssetModal
        asset={selectedAsset}
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        role={role}
        lang={lang}
        onConfirm={(params) => {
          const trf = initiateTransfer(params);
          if (trf) {
            showToast(
              t(
                `✓ Gate Pass ${trf.gatePassNo} issued! ${trf.assetTag} is now In Transit to ${trf.toCustodian}.`,
                `✓ গেট পাস ${trf.gatePassNo} জারি হয়েছে! স্থানান্তর প্রক্রিয়া শুরু।`,
                lang
              ),
              'info'
            );
          }
        }}
      />

      <CreateWorkOrderModal
        assets={roleScopedAssets}
        defaultAssetId={selectedAsset?.id}
        isOpen={showWorkOrderModal}
        onClose={() => setShowWorkOrderModal(false)}
        role={role}
        lang={lang}
        onCreate={(params) => {
          const wo = createWorkOrder(params);
          if (wo) {
            showToast(
              t(
                `✓ Dispatched ${wo.woNumber} for ${wo.assetTag}${wo.coveredByWarranty ? ' (৳0 OEM Warranty Claim)' : ''}.`,
                `✓ কার্যাদেশ ${wo.woNumber} সফলভাবে জারি করা হয়েছে।`,
                lang
              ),
              'success'
            );
          }
        }}
      />

      <SubmitAssetRequisitionModal
        isOpen={showRequisitionModal}
        onClose={() => setShowRequisitionModal(false)}
        role={role}
        lang={lang}
        onSubmitReq={(params) => {
          const req = submitRequisition(params);
          setActiveTab('transfers');
          showToast(
            t(
              `✓ Asset Requisition ${req.reqNumber} submitted into multi-tier approval pipeline.`,
              `✓ সম্পদ রিকুইজিশন ${req.reqNumber} অনুমোদনের জন্য দাখিল হয়েছে।`,
              lang
            ),
            'gold'
          );
        }}
      />

      <InitiateDecommissionModal
        asset={selectedAsset}
        isOpen={showDecommissionModal}
        onClose={() => setShowDecommissionModal(false)}
        role={role}
        lang={lang}
        onConfirm={(assetId, reason, notes, actorName, actorRole) => {
          initiateDecommissioning(assetId, reason, notes, actorName, actorRole);
          setActiveTab('disposal');
          showToast(
            t(
              `Condemnation survey logged. Asset moved to the write-off queue.`,
              `অকেজো জরিপ সম্পন্ন। চূড়ান্ত অবলোপনের তালিকায় স্থানান্তরিত।`,
              lang
            ),
            'warn'
          );
        }}
      />

      <FinalizeDisposalModal
        asset={disposalTargetAsset}
        isOpen={!!disposalTargetAsset}
        onClose={() => setDisposalTargetAsset(null)}
        role={role}
        lang={lang}
        onFinalize={(params) => {
          const res = finalizeDisposalAndArchive(params);
          if (res) {
            showToast(
              t(
                `Write-off sanctioned. Voucher ${res.sapVoucher} posted (${res.gainOrLoss >= 0 ? `+৳${res.gainOrLoss.toLocaleString()} gain` : `-৳${Math.abs(res.gainOrLoss).toLocaleString()} loss`}). Locked in the 10-year archive.`,
                `অবলোপন অনুমোদিত। এসএপি ভাউচার ${res.sapVoucher} পোস্ট ও ১০-বছরের আর্কাইভে সংরক্ষিত।`,
                lang
              ),
              'gold'
            );
          }
        }}
      />

      <DepreciationScheduleModal
        asset={scheduleTargetAsset}
        isOpen={!!scheduleTargetAsset}
        onClose={() => setScheduleTargetAsset(null)}
        canEditPolicy={roleConfig.canEditDepreciationPolicy}
        onChangeMethod={changeDepreciationMethod}
        role={role}
        lang={lang}
      />

      <AssetPassportModal
        asset={selectedAsset}
        isOpen={showPassportModal}
        onClose={() => setShowPassportModal(false)}
        lang={lang}
      />

      <AssetScannerModal
        assets={roleScopedAssets}
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        onSelectScanned={(a) => {
          inspectAssetInCockpit(a.id);
        }}
        lang={lang}
      />

      {selectedAsset && (
        <RejectionExplanationModal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          onConfirm={handleConfirmAssetReject}
          lang={lang}
          title={
            roleConfig.isSelfServiceOnly
              ? t('Report Equipment Defect / Request Maintenance', 'সরঞ্জামের ত্রুটি বা মেরামতের অনুরোধ জানান', lang)
              : t('Flag Calibration Deficiency / Reject Work Order', 'ক্যালিব্রেশন ত্রুটি বা আপত্তি উত্থাপন করুন', lang)
          }
          itemId={selectedAsset.tag}
          itemTitle={selectedAsset.name}
          requesterName={selectedAsset.custodian}
          department={selectedAsset.facility}
          amount={roleConfig.canViewFinancialLedger ? selectedFinancials?.netBookValue : undefined}
          categoryType="asset"
        />
      )}
    </div>
  );
}
