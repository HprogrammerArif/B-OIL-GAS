import React, { useState, useEffect, useMemo } from 'react';
import { ViewProps, ROLE_META, t } from '../types';
import { showToast } from '../App';
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
import {
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Search,
  Download,
  Plus,
  RefreshCw,
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
  Sparkles,
  CheckSquare,
  Square,
  Eye,
  X,
  LayoutGrid,
  Table as TableIcon,
  QrCode,
  ExternalLink,
} from 'lucide-react';

type MainModuleTab = 'register' | 'maintenance' | 'financials' | 'transfers' | 'disposal';
type InspectorSubTab = 'overview' | 'timeline' | 'custody' | 'spares';
type KpiQuickFilter = 'none' | 'pending_signoff' | 'cal_alerts' | 'eol_watch';

export default function AssetView({ role, lang }: ViewProps) {
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

  const roleConfig = useMemo(() => getAssetRoleConfig(role), [role]);
  const currentPersona = ROLE_META[role];

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
      return assets.filter(
        (a) => a.custodianEmpId === 'EMP-1042' || a.custodian.toLowerCase().includes('tanvir ahmed')
      );
    }
    return assets;
  }, [assets, roleConfig.isSelfServiceOnly]);

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
      return requisitions.filter(
        (r) => r.requestedByEmpId === 'EMP-1042' || r.requestedBy.toLowerCase().includes('tanvir ahmed')
      );
    }
    return requisitions;
  }, [requisitions, roleConfig.isSelfServiceOnly]);

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

  // Format BDT compact helper
  const fmtBdtShort = (val: number) => {
    if (val >= 10000000) return `৳${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `৳${(val / 100000).toFixed(2)}L`;
    return `৳${val.toLocaleString()}`;
  };

  // Badge Helpers
  const getStageBadge = (stage: LifecycleStage, daysToService?: number) => {
    switch (stage) {
      case 'operational':
        return <span className="badge success">{t('Operational', 'সক্রিয় চালু', lang)}</span>;
      case 'in_stock':
        return <span className="badge info">{t('Store Pool', 'স্টোর পুল', lang)}</span>;
      case 'in_transfer':
        return <span className="badge travel">{t('In Transit', 'স্থানান্তরধীন', lang)}</span>;
      case 'calibration_due':
        return (
          <span className="badge danger">
            {t(`Audit Due (${daysToService ?? 10}d)`, `ক্যালিব্রেশন (${daysToService ?? 10} দিন)`, lang)}
          </span>
        );
      case 'maintenance':
        return <span className="badge warn">{t('Under Overhaul', 'মেরামতাধীন', lang)}</span>;
      case 'decommissioned':
        return <span className="badge danger">{t('Condemned', 'অকেজো ঘোষিত', lang)}</span>;
      case 'disposed':
        return (
          <span className="badge" style={{ background: 'var(--brand-slate-200)', color: 'var(--brand-slate-700)' }}>
            {t('10y Archive', 'নিষ্পত্তিকৃত আর্কাইভ', lang)}
          </span>
        );
    }
  };

  const getCriticalityBadge = (crit: AssetRecord['criticality']) => {
    if (crit === 'critical_a') {
      return (
        <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '1.5px 6px', borderRadius: '4px', background: 'rgba(220,38,38,0.12)', color: '#DC2626' }}>
          Class-A
        </span>
      );
    }
    if (crit === 'essential_b') {
      return (
        <span style={{ fontSize: '9.5px', fontWeight: 700, padding: '1.5px 6px', borderRadius: '4px', background: 'rgba(217,119,6,0.12)', color: '#D97706' }}>
          Class-B
        </span>
      );
    }
    return (
      <span style={{ fontSize: '9.5px', fontWeight: 600, padding: '1.5px 6px', borderRadius: '4px', background: 'var(--brand-slate-100)', color: 'var(--brand-slate-500)' }}>
        Class-C
      </span>
    );
  };

  // Export Master Financial Ledger CSV
  const handleExportMasterLedgerCsv = () => {
    const header =
      'Tag,SAP_FI_AA,Title,Category,Facility,GL_Cost_Center,Lifecycle_Stage,Method,Gross_CAPEX_BDT,Accumulated_Dep_BDT,Net_Book_Value_BDT,Cumulative_OPEX_BDT,TCO_BDT,Repair_Ratio_Pct\n';
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
    showToast(t('Exported SAP FI-AA Fixed Asset & TCO Master Ledger (CSV).', 'সম্পূর্ণ স্থায়ী সম্পদ ও অবচয় খতিয়ান ডাউনলোড হয়েছে।', lang), 'success');
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
      currentPersona.label
    );
    setShowRejectModal(false);
    showToast(
      t(
        `Fault / Deficiency logged on ${selectedAsset.tag} & Corrective Work Order auto-dispatched.`,
        `${selectedAsset.tag}-এ ত্রুটি নথিভুক্ত ও মেরামত কার্যাদেশ তৈরি হয়েছে।`,
        lang
      ),
      'warn'
    );
  };

  const selectedFinancials = selectedAsset ? calculateAssetFinancials(selectedAsset) : null;

  // Smart Contextual Next-Action Guidance Renderer for 360° Cockpit
  const renderSmartNextAction = () => {
    if (!selectedAsset || !selectedFinancials || selectedAsset.lifecycleStage === 'disposed') return null;

    // 1. Custody Acceptance Signature Pending
    if (!selectedAsset.custodianAcknowledged) {
      return (
        <div className="eam-next-action">
          <div className="eam-next-action-text">
            <UserCheck size={17} style={{ color: '#D97706', flexShrink: 0 }} />
            <div>
              <strong>{t('Recommended Action — Custody Handover Sign-Off:', 'প্রস্তাবিত পদক্ষেপ — হস্তান্তর গ্রহণ স্বাক্ষর:', lang)}</strong>{' '}
              {t(
                `Issued to ${selectedAsset.custodian}. Digital acceptance signature is pending.`,
                `${selectedAsset.custodian}-এর ডিজিটাল গ্রহণ স্বাক্ষর অপেক্ষমাণ।`,
                lang
              )}
            </div>
          </div>
          <button
            type="button"
            className="btn-gold"
            style={{ padding: '6px 13px', fontSize: '11.5px', fontWeight: 800 }}
            onClick={() => {
              acknowledgeCustody(selectedAsset.id, currentPersona.name, currentPersona.label);
              showToast(
                t(`✓ Custody receipt digitally signed for ${selectedAsset.tag}!`, `✓ ${selectedAsset.tag}-এর হেফাজত গ্রহণ স্বাক্ষর সম্পন্ন!`, lang),
                'gold'
              );
            }}
          >
            ✍️ {t('Sign Custody Receipt', 'গ্রহণ স্বাক্ষর করুন', lang)}
          </button>
        </div>
      );
    }

    // 2. Asset In Transit under Gate Pass
    if (selectedAsset.lifecycleStage === 'in_transfer' && selectedOpenTransfer) {
      return (
        <div className="eam-next-action info">
          <div className="eam-next-action-text">
            <ArrowRightLeft size={17} style={{ color: '#0284C7', flexShrink: 0 }} />
            <div>
              <strong>{t('In Transit under Gate Pass', 'গেট পাসের অধীনে স্থানান্তরধীন', lang)} ({selectedOpenTransfer.gatePassNo}):</strong>{' '}
              {t(
                `En route to ${selectedOpenTransfer.toCustodian} at ${selectedOpenTransfer.toFacility}.`,
                `গন্তব্য: ${selectedOpenTransfer.toFacility} (${selectedOpenTransfer.toCustodian})।`,
                lang
              )}
            </div>
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: '6px 13px', fontSize: '11.5px' }}
            onClick={() => {
              completeTransfer(selectedOpenTransfer.id, currentPersona.name, currentPersona.label);
              showToast(
                t(
                  `✓ Gate Pass ${selectedOpenTransfer.gatePassNo} closed! ${selectedAsset.tag} received at destination.`,
                  `✓ গেট পাস ${selectedOpenTransfer.gatePassNo} সম্পন্ন ও হস্তান্তরিত!`,
                  lang
                ),
                'success'
              );
            }}
          >
            <CheckCircle size={13} /> {t('Confirm Arrival & Close Gate Pass', 'প্রাপ্তি নিশ্চিত করুন', lang)}
          </button>
        </div>
      );
    }

    // 3. Asset Sitting in Central Store Pool (Stage 3)
    if (selectedAsset.lifecycleStage === 'in_stock' && roleConfig.canTransferCustody) {
      return (
        <div className="eam-next-action info">
          <div className="eam-next-action-text">
            <Package size={17} style={{ color: '#0284C7', flexShrink: 0 }} />
            <div>
              <strong>{t('Ready in Central Store Pool (Stage 3):', 'কেন্দ্রীয় স্টোর পুলে প্রস্তুত:', lang)}</strong>{' '}
              {t(
                'Capitalized & QR-tagged. Assign to an active officer or plant unit to commission into Stage-4 service.',
                'সক্রিয় অপারেশনে যুক্ত করতে একজন কর্মকর্তার হেফাজতে বরাদ্দ দিন।',
                lang
              )}
            </div>
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: '6px 13px', fontSize: '11.5px' }}
            onClick={() => setShowTransferModal(true)}
          >
            <ArrowRightLeft size={13} /> {t('Assign Custodian & Deploy', 'কর্মকর্তাকে বরাদ্দ দিন', lang)}
          </button>
        </div>
      );
    }

    // 4. Calibration Due / Under Overhaul
    if (
      (selectedAsset.lifecycleStage === 'calibration_due' ||
        selectedAsset.lifecycleStage === 'maintenance' ||
        (selectedAsset.daysToService > 0 && selectedAsset.daysToService <= 20)) &&
      (roleConfig.canCertifyCalibration || roleConfig.canManageWorkOrders)
    ) {
      return (
        <div className="eam-next-action danger">
          <div className="eam-next-action-text">
            <AlertTriangle size={17} style={{ color: '#DC2626', flexShrink: 0 }} />
            <div>
              <strong>{t('Statutory Calibration / Reliability Attention:', 'সংবিধিবদ্ধ ক্যালিব্রেশন / সার্ভিস সতর্কতা:', lang)}</strong>{' '}
              {t(
                `Next ${selectedAsset.regulatoryAuthority || 'PM'} window is ${selectedAsset.daysToService} days (${selectedAsset.nextServiceDate}).`,
                `পরবর্তী ক্যালিব্রেশন তারিখ ${selectedAsset.nextServiceDate} (${selectedAsset.daysToService} দিন বাকি)।`,
                lang
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {roleConfig.canCertifyCalibration && (
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: '11.5px' }}
                onClick={() => {
                  certifyAssetDirect(selectedAsset.id, currentPersona.name, currentPersona.label);
                  showToast(
                    t(`✓ Calibration certified for ${selectedAsset.tag}!`, `✓ ${selectedAsset.tag}-এর ক্যালিব্রেশন প্রত্যয়িত!`, lang),
                    'success'
                  );
                }}
              >
                <CheckCircle size={13} /> {t('Certify Now', 'প্রত্যয়ন করুন', lang)}
              </button>
            )}
            {roleConfig.canManageWorkOrders && (
              <button
                type="button"
                className="btn-outline"
                style={{ padding: '6px 12px', fontSize: '11.5px' }}
                onClick={() => setShowWorkOrderModal(true)}
              >
                <Wrench size={13} /> {t('Create WO', 'কার্যাদেশ', lang)}
              </button>
            )}
          </div>
        </div>
      );
    }

    // 5. Stage-7 Condemned Pending Write-Off
    if (selectedAsset.lifecycleStage === 'decommissioned') {
      return (
        <div className="eam-next-action danger">
          <div className="eam-next-action-text">
            <ShieldAlert size={17} style={{ color: '#DC2626', flexShrink: 0 }} />
            <div>
              <strong>{t('Stage-7 Condemned — Awaiting Write-Off & Disposal:', 'পর্যায়-৭ অকেজো ঘোষিত — চূড়ান্ত অবলোপন অপেক্ষমাণ:', lang)}</strong>{' '}
              {t(
                'Complete the 4-point pre-disposal safety & CFO audit checklist to post SAP retirement.',
                '৪-দফা প্রাক-অবলোপন যাচাইকরণ সম্পন্ন করে নিলাম নিষ্পত্তি করুন।',
                lang
              )}
            </div>
          </div>
          <button
            type="button"
            className="btn-gold"
            style={{ padding: '6px 13px', fontSize: '11.5px', fontWeight: 800 }}
            onClick={() => setActiveTab('disposal')}
          >
            📋 {t('Open Write-Off Checklist', 'চেকলিস্ট খুলুন', lang)}
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="view-container">
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION HEADER + PRIMARY QUICK ACTIONS
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="section-header" style={{ marginBottom: '12px' }}>
        <div>
          <h2 className="section-title">
            🏗️{' '}
            {roleConfig.isSelfServiceOnly
              ? t('My Assigned Corporate Assets & Equipment Portal', 'আমার বরাদ্দকৃত প্রাতিষ্ঠানিক সম্পদ ও রিকুইজিশন পোর্টাল', lang)
              : t('Enterprise Asset Lifetime Tracking & EAM System', 'এন্টারপ্রাইজ সম্পদ জীবনচক্র ট্র্যাকিং ও রক্ষণাবেক্ষণ সিস্টেম', lang)}
          </h2>
          <p className="section-subtitle">
            {t(
              'ISO 55001 Cradle-to-Grave Lifecycle • IAS 16 Fixed Asset Valuation • Statutory Calibration • Chain-of-Custody & 10-Yr Archive',
              'ক্রয় রিকুইজিশন হতে কমিশনিং, হস্তান্তর, ক্যালিব্রেশন, অবচয় হিসাবায়ন (IAS 16) এবং চূড়ান্ত অবলোপন আর্কাইভ পর্যন্ত পূর্ণ ব্যবস্থাপনা।',
              lang
            )}
          </p>
        </div>

        <div className="btn-group" style={{ flexWrap: 'wrap' }}>
          {roleConfig.canRegisterAsset && (
            <button type="button" className="btn-primary" onClick={() => setShowRegisterModal(true)}>
              <Plus size={15} /> {t('Commission Asset', 'নতুন সম্পদ নিবন্ধন', lang)}
            </button>
          )}
          <button
            type="button"
            className={roleConfig.canRegisterAsset ? 'btn-outline' : 'btn-primary'}
            onClick={() => setShowRequisitionModal(true)}
          >
            <FilePlus size={15} /> {t('Request Asset', 'সম্পদ রিকুইজিশন', lang)}
          </button>
          <button type="button" className="btn-outline" onClick={() => setShowScanModal(true)}>
            <Barcode size={15} /> {t('Scan QR / RFID', 'ট্যাগ স্ক্যান', lang)}
          </button>
        </div>
      </div>

      {/* Compact RBAC Governance Context Strip */}
      <div className="eam-role-strip">
        <div className="eam-role-strip-left">
          <div className="eam-role-avatar" style={{ background: currentPersona.avatarColor }}>
            {currentPersona.initials}
          </div>
          <div>
            <div className="eam-role-title">{t(roleConfig.roleTitle, roleConfig.roleTitleBn, lang)}</div>
            <div className="eam-role-desc">{t(roleConfig.scopeDescription, roleConfig.scopeDescriptionBn, lang)}</div>
          </div>
        </div>
        <span className="eam-scope-pill">
          <Sparkles size={12} /> {t(roleConfig.scopeBadge, roleConfig.scopeBadgeBn, lang)}
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          INTERACTIVE 1-CLICK KPI WORKLIST RIBBON
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="eam-kpi-grid">
        {/* KPI 1: Portfolio Carrying NBV */}
        <button
          type="button"
          className="eam-kpi-card crimson"
          onClick={() => {
            setActiveTab('register');
            resetAllFilters();
          }}
        >
          <div className="eam-kpi-top">
            <span className="eam-kpi-label">
              {roleConfig.isSelfServiceOnly
                ? t('My Custody Asset Value', 'আমার হেফাজতে সম্পদের মূল্য', lang)
                : t('Carrying Net Book Value', 'বর্তমান নিট বইমূল্য (NBV)', lang)}
            </span>
            <span className="eam-kpi-icon"><DollarSign size={15} /></span>
          </div>
          <div className="eam-kpi-val">{fmtBdtShort(portfolioStats.totalNbv)}</div>
          <div className="eam-kpi-foot">
            <span>Gross CAPEX: {fmtBdtShort(portfolioStats.totalGross)} ({portfolioStats.activeCount})</span>
            <span className="eam-kpi-hint">{t('View All →', 'সকল দেখুন →', lang)}</span>
          </div>
        </button>

        {/* KPI 2: Operational Availability & Custody Sign-Offs */}
        <button
          type="button"
          className={`eam-kpi-card emerald ${kpiFilter === 'pending_signoff' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveTab('register');
            if (portfolioStats.pendingSignOffs > 0) {
              setKpiFilter((prev) => (prev === 'pending_signoff' ? 'none' : 'pending_signoff'));
            } else {
              setStageFilter((prev) => (prev === 'operational' ? 'active_all' : 'operational'));
            }
          }}
        >
          <div className="eam-kpi-top">
            <span className="eam-kpi-label">{t('Operational Availability', 'অপারেশনাল প্রস্তুতি ও হেফাজত', lang)}</span>
            <span className="eam-kpi-icon"><ShieldCheck size={15} /></span>
          </div>
          <div className="eam-kpi-val">{portfolioStats.availabilityPct}%</div>
          <div className="eam-kpi-foot">
            <span>
              {portfolioStats.pendingSignOffs > 0
                ? `✍️ ${portfolioStats.pendingSignOffs} handover sign-off pending`
                : '✓ 100% custody chain signed'}
            </span>
            <span className="eam-kpi-hint">
              {kpiFilter === 'pending_signoff' ? t('Reset ×', 'রিসেট ×', lang) : t('Filter →', 'ফিল্টার →', lang)}
            </span>
          </div>
        </button>

        {/* KPI 3: Calibration & PM Alerts */}
        <button
          type="button"
          className={`eam-kpi-card amber ${kpiFilter === 'cal_alerts' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveTab('register');
            setKpiFilter((prev) => (prev === 'cal_alerts' ? 'none' : 'cal_alerts'));
          }}
        >
          <div className="eam-kpi-top">
            <span className="eam-kpi-label">{t('Calibration & PM Alerts', 'ক্যালিব্রেশন ও সার্ভিস সতর্কতা', lang)}</span>
            <span className="eam-kpi-icon"><Wrench size={15} /></span>
          </div>
          <div className="eam-kpi-val">
            {portfolioStats.calAlerts} {t('Assets', 'টি সম্পদ', lang)}
          </div>
          <div className="eam-kpi-foot">
            <span>{baseWorkOrders.filter((w) => w.status !== 'completed').length} open CMMS work orders</span>
            <span className="eam-kpi-hint">
              {kpiFilter === 'cal_alerts' ? t('Reset ×', 'রিসেট ×', lang) : t('Filter Due →', 'বাকিগুলো →', lang)}
            </span>
          </div>
        </button>

        {/* KPI 4: TCO / Write-Off Watch (or Open Requisitions for Staff) */}
        <button
          type="button"
          className={`eam-kpi-card blue ${kpiFilter === 'eol_watch' ? 'is-active' : ''}`}
          onClick={() => {
            if (roleConfig.isSelfServiceOnly) {
              setActiveTab('transfers');
            } else if (decommissionedAssets.length > 0 && activeTab !== 'disposal') {
              setActiveTab('disposal');
            } else {
              setActiveTab('register');
              setStageFilter('all');
              setKpiFilter((prev) => (prev === 'eol_watch' ? 'none' : 'eol_watch'));
            }
          }}
        >
          <div className="eam-kpi-top">
            <span className="eam-kpi-label">
              {roleConfig.isSelfServiceOnly
                ? t('My Open Requisitions', 'আমার চলমান রিকুইজিশন', lang)
                : t('Write-Off & EoL Watch', 'অবলোপন ও আর্কাইভ নজরদারি', lang)}
            </span>
            <span className="eam-kpi-icon"><Archive size={15} /></span>
          </div>
          <div className="eam-kpi-val">
            {roleConfig.isSelfServiceOnly
              ? `${visibleRequisitions.length} Req`
              : `${decommissionedAssets.length} Write-Off`}
          </div>
          <div className="eam-kpi-foot">
            <span>
              {roleConfig.isSelfServiceOnly
                ? 'Multi-tier approval tracked live'
                : `Dep: ${fmtBdtShort(portfolioStats.totalAccDep)} · ${disposedAssets.length} Archived`}
            </span>
            <span className="eam-kpi-hint">{t('Open →', 'খুলুন →', lang)}</span>
          </div>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          EXECUTIVE 5-MODULE NAVIGATION BAR
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="eam-nav-bar">
        <button
          type="button"
          className={`eam-nav-tab ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => setActiveTab('register')}
        >
          <Layers size={15} />
          <span>
            {roleConfig.isSelfServiceOnly
              ? t('My Custody Assets', 'আমার বরাদ্দকৃত সম্পদ', lang)
              : t('Asset Register & 360° Cockpit', 'সম্পদ রেজিস্টার ও ৩৬০° ডসিয়ার', lang)}
          </span>
          <span className="eam-nav-count">{roleScopedAssets.filter((a) => a.lifecycleStage !== 'disposed').length}</span>
        </button>

        <button
          type="button"
          className={`eam-nav-tab ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          <Wrench size={15} />
          <span>
            {roleConfig.isSelfServiceOnly
              ? t('Service & Defect Logs', 'মেরামত ও ত্রুটি লগ', lang)
              : t('Calibration & Work Orders', 'ক্যালিব্রেশন ও কার্যাদেশ', lang)}
          </span>
          <span className="eam-nav-count warn">{baseWorkOrders.filter((w) => w.status !== 'completed').length}</span>
        </button>

        {roleConfig.canViewFinancialLedger && (
          <button
            type="button"
            className={`eam-nav-tab ${activeTab === 'financials' ? 'active' : ''}`}
            onClick={() => setActiveTab('financials')}
          >
            <DollarSign size={15} />
            <span>{t('IAS 16 Valuation & TCO Ledger', 'অবচয় (IAS 16) ও আর্থিক খতিয়ান', lang)}</span>
          </button>
        )}

        <button
          type="button"
          className={`eam-nav-tab ${activeTab === 'transfers' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfers')}
        >
          <ArrowRightLeft size={15} />
          <span>
            {roleConfig.isSelfServiceOnly
              ? t('My Asset Requisitions', 'নতুন সম্পদের আবেদন', lang)
              : t('Requisitions & Gate-Pass Transit', 'রিকুইজিশন ও স্থানান্তর', lang)}
          </span>
          <span className="eam-nav-count">
            {visibleRequisitions.filter((r) => r.stage !== 'commissioned' && r.stage !== 'rejected').length}
          </span>
        </button>

        {!roleConfig.isSelfServiceOnly && (
          <button
            type="button"
            className={`eam-nav-tab ${activeTab === 'disposal' ? 'active' : ''}`}
            onClick={() => setActiveTab('disposal')}
          >
            <Archive size={15} />
            <span>{t('Condemnation & 10-Yr Archive', 'অকেজো ঘোষণা, নিলাম ও আর্কাইভ', lang)}</span>
            {decommissionedAssets.length > 0 && (
              <span className="eam-nav-count danger">{decommissionedAssets.length}</span>
            )}
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: MASTER REGISTER & 360° CRADLE-TO-GRAVE COCKPIT
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'register' && (
        <>
          {/* Unified Filter & View-Mode Toolbar */}
          <div className="eam-toolbar">
            {!roleConfig.isSelfServiceOnly && (
              <div className="eam-toolbar-top">
                <div className="eam-cat-chips">
                  {(
                    [
                      ['all', t('All Assets', 'সকল সম্পদ', lang)],
                      ['plant', `⚙️ ${t('Refinery Plant', 'রিফাইনারি', lang)}`],
                      ['vehicle', `🚛 ${t('Fleet & Tankers', 'ফ্লিট ও ট্যাংকার', lang)}`],
                      ['it', `💻 ${t('SCADA & IT', 'স্কাডা ও আইটি', lang)}`],
                      ['safety', `🛡️ ${t('Safety / HSE', 'নিরাপত্তা', lang)}`],
                      ['lab', `🔬 ${t('QC Metrology', 'কিউসি ল্যাব', lang)}`],
                      ['corporate', `🏢 ${t('Corporate', 'করপোরেট', lang)}`],
                    ] as const
                  ).map(([catKey, label]) => {
                    const count = categoryCounts[catKey] ?? 0;
                    if (catKey === 'corporate' && count === 0 && categoryFilter !== 'corporate') return null;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        className={`eam-cat-chip ${categoryFilter === catKey ? 'active' : ''}`}
                        onClick={() => setCategoryFilter(catKey)}
                      >
                        <span>{label}</span>
                        <span className="eam-cat-chip-count">{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Desktop View-Mode Switcher: Split Cockpit vs Full Table */}
                <div className="eam-view-switcher">
                  <button
                    type="button"
                    className={`eam-view-btn ${viewMode === 'cockpit' ? 'active' : ''}`}
                    onClick={() => setViewMode('cockpit')}
                  >
                    <LayoutGrid size={13} /> {t('360° Cockpit', '৩৬০° ককপিট', lang)}
                  </button>
                  <button
                    type="button"
                    className={`eam-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    <TableIcon size={13} /> {t('Master Table', 'পূর্ণ টেবিল', lang)}
                  </button>
                </div>
              </div>
            )}

            <div className="eam-toolbar-controls">
              <div className="eam-search-box">
                <Search size={14} className="eam-search-icon" />
                <input
                  type="text"
                  className="eam-search-input"
                  placeholder={t('Search tag, SAP FI-AA, serial, custodian, or location...', 'ট্যাগ, এসএপি কোড, সিরিয়াল বা নাম খুঁজুন...', lang)}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="eam-search-clear"
                    onClick={() => setSearchTerm('')}
                    title="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {!roleConfig.isSelfServiceOnly && (
                <>
                  <select
                    className="eam-filter-select"
                    value={facilityFilter}
                    onChange={(e) => setFacilityFilter(e.target.value)}
                  >
                    <option value="all">{t('All 3 BOGCL Sites', 'সকল স্থাপনা (৩টি)', lang)}</option>
                    <option value="Keraniganj Bitumen Refinery">Keraniganj Refinery</option>
                    <option value="Bashundhara Corporate HQ, Baridhara">Baridhara Corporate HQ</option>
                    <option value="Chattogram Patenga Terminal">Chattogram Marine Terminal</option>
                  </select>

                  <select
                    className="eam-filter-select"
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                  >
                    <option value="active_all">{t('Active Lifecycle Stages', 'সক্রিয় জীবনচক্র ধাপ', lang)}</option>
                    <option value="operational">Stage 4: Operational</option>
                    <option value="in_stock">Stage 3: Central Store Pool</option>
                    <option value="in_transfer">Stage 5: In Transit</option>
                    <option value="calibration_due">Stage 6: Calibration Due</option>
                    <option value="maintenance">Stage 6: Under Overhaul</option>
                    <option value="decommissioned">Stage 7: Condemned</option>
                    <option value="disposed">Stage 8: 10-Yr Archive</option>
                    <option value="all">All (Incl. Disposed Archive)</option>
                  </select>
                </>
              )}

              {hasActiveFilters && (
                <button type="button" className="eam-reset-btn" onClick={resetAllFilters}>
                  <X size={13} /> {t('Reset Filters', 'ফিল্টার মুছুন', lang)} ({filteredAssets.length})
                </button>
              )}
            </div>
          </div>

          {/* Mobile List / 360° Dossier Switcher */}
          {viewMode === 'cockpit' && (
            <div className="mobile-view-toggle">
              <button type="button" className={mobileTab === 'list' ? 'active' : ''} onClick={() => setMobileTab('list')}>
                <Layers size={14} /> {t('Asset Feed', 'সম্পদ তালিকা', lang)} ({filteredAssets.length})
              </button>
              <button type="button" className={mobileTab === 'detail' ? 'active' : ''} onClick={() => setMobileTab('detail')}>
                <FileText size={14} /> {t('360° Dossier', 'জীবনচক্র ডসিয়ার', lang)} {selectedAsset ? `(${selectedAsset.tag})` : ''}
              </button>
            </div>
          )}

          {/* MODE A: FULL-WIDTH MASTER TABLE VIEW */}
          {viewMode === 'table' ? (
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon"><TableIcon size={16} /></div>
                  <div>
                    <div className="card-title">{t('ISO 14224 Enterprise Asset Master Table', 'এন্টারপ্রাইজ মূলধনী সম্পদ পূর্ণ তালিকা', lang)}</div>
                    <div className="card-subtitle">
                      {t('Showing', 'প্রদর্শিত:', lang)} {filteredAssets.length} {t('assets — click any row to open its 360° Cockpit Dossier', 'টি সম্পদ — যেকোনো সারিতে ক্লিক করে ৩৬০° ডসিয়ার খুলুন', lang)}
                    </div>
                  </div>
                </div>
                <button type="button" className="btn-outline" onClick={handleExportMasterLedgerCsv}>
                  <Download size={14} /> {t('Export CSV', 'সিএসভি এক্সপোর্ট', lang)}
                </button>
              </div>

              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('Tag & Equipment Title', 'ট্যাগ ও যন্ত্রপাতির নাম', lang)}</th>
                        <th>{t('Facility & Location', 'স্থাপনা ও অবস্থান', lang)}</th>
                        <th>{t('Custodian Officer', 'হেফাজতকারী কর্মকর্তা', lang)}</th>
                        <th>{t('Carrying NBV', 'বর্তমান বইমূল্য', lang)}</th>
                        <th>{t('Health & Next Audit', 'স্বাস্থ্য ও ক্যালিব্রেশন', lang)}</th>
                        <th>{t('Stage', 'ধাপ', lang)}</th>
                        <th style={{ textAlign: 'right' }}>{t('360° Dossier', 'ডসিয়ার', lang)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--brand-slate-400)' }}>
                            {t('No assets match the active filters.', 'নির্বাচিত ফিল্টারে কোনো সম্পদ পাওয়া যায়নি।', lang)}
                          </td>
                        </tr>
                      ) : (
                        filteredAssets.map((item) => {
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
                                <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--brand-slate-900)' }}>{item.name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                  <span className="eam-tag-mono">{item.tag}</span>
                                  {getCriticalityBadge(item.criticality)}
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize: '12px', fontWeight: 600 }}>{item.facility.split(',')[0]}</div>
                                <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>{item.functionalLocation}</div>
                              </td>
                              <td>
                                <div style={{ fontSize: '12px', fontWeight: 600 }}>{item.custodian}</div>
                                {!item.custodianAcknowledged && item.lifecycleStage !== 'disposed' ? (
                                  <span className="badge warn" style={{ fontSize: '9.5px' }}>✍️ Sign Pending</span>
                                ) : (
                                  <span style={{ fontSize: '10.5px', color: '#059669', fontWeight: 600 }}>✓ Verified</span>
                                )}
                              </td>
                              <td>
                                <div style={{ fontWeight: 800, fontSize: '12.5px' }}>
                                  {item.lifecycleStage === 'disposed' ? '৳0 (Retired)' : fmtBdtShort(f.netBookValue)}
                                </div>
                                <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)', fontFamily: 'monospace' }}>
                                  {item.depreciationMethod} · {item.sapAssetNo}
                                </div>
                              </td>
                              <td>
                                {item.lifecycleStage === 'disposed' || item.lifecycleStage === 'decommissioned' ? (
                                  <span style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>End-of-Life</span>
                                ) : (
                                  <>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: item.healthScore >= 85 ? '#059669' : '#D97706' }}>
                                      ♥ {item.healthScore}% Health
                                    </div>
                                    <div style={{ fontSize: '11px', color: item.daysToService <= 15 ? '#DC2626' : 'var(--brand-slate-500)' }}>
                                      Audit in {item.daysToService}d
                                    </div>
                                  </>
                                )}
                              </td>
                              <td>{getStageBadge(item.lifecycleStage, item.daysToService)}</td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  type="button"
                                  className="btn-outline"
                                  style={{ padding: '5px 10px', fontSize: '11px' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAssetId(item.id);
                                    setViewMode('cockpit');
                                  }}
                                >
                                  <Eye size={12} /> {t('Open 360°', 'খুলুন', lang)}
                                </button>
                              </td>
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
            /* MODE B: TWO-COLUMN 360° COCKPIT MASTER-DETAIL LAYOUT */
            <div className="eam-cockpit-grid">
              {/* LEFT PANEL: Clean Selectable Asset Feed Cards */}
              <div className={`eam-feed-panel ${mobileTab === 'detail' ? 'eam-mobile-hidden' : ''}`}>
                <div className="eam-feed-hd">
                  <div>
                    <div className="eam-feed-title">
                      <Layers size={15} style={{ color: 'var(--brand-crimson)' }} />
                      <span>
                        {roleConfig.isSelfServiceOnly
                          ? t('My Custody Equipment', 'আমার বরাদ্দকৃত সরঞ্জাম', lang)
                          : t('Asset Portfolio Feed', 'সম্পদ তালিকা', lang)}
                      </span>
                    </div>
                    <div className="eam-feed-count">
                      {t('Showing', 'প্রদর্শিত', lang)} <strong>{filteredAssets.length}</strong>{' '}
                      {t('of', '/', lang)} {roleScopedAssets.length} {t('records', 'টি রেকর্ড', lang)}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-sm-ghost"
                    title="Sync SAP FI-AA & SCADA IoT"
                    onClick={() =>
                      showToast(
                        t('Synchronized SAP S/4HANA FI-AA & Plant SCADA runtime telemetry.', 'এসএপি ও স্কাডা টেলিমেট্রির সাথে সিঙ্ক সম্পন্ন।', lang),
                        'info'
                      )
                    }
                  >
                    <RefreshCw size={13} /> {t('Sync', 'সিঙ্ক', lang)}
                  </button>
                </div>

                <div className="eam-feed-list">
                  {filteredAssets.length === 0 ? (
                    <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--brand-slate-400)', fontSize: '12.5px' }}>
                      <div style={{ marginBottom: '10px' }}>
                        {t('No assets match your current filter criteria.', 'নির্বাচিত ফিল্টারে কোনো সম্পদ পাওয়া যায়নি।', lang)}
                      </div>
                      {hasActiveFilters && (
                        <button type="button" className="btn-outline" style={{ fontSize: '11.5px' }} onClick={resetAllFilters}>
                          {t('Reset All Filters', 'সকল ফিল্টার রিসেট করুন', lang)}
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredAssets.map((item) => {
                      const f = calculateAssetFinancials(item);
                      const isSelected = selectedAsset?.id === item.id;
                      const healthColor = item.healthScore >= 85 ? '#059669' : item.healthScore >= 60 ? '#D97706' : '#DC2626';

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
                          <div className="eam-feed-row-top">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                              <span className="eam-tag-mono">🏷️ {item.tag}</span>
                              {getCriticalityBadge(item.criticality)}
                            </div>
                            {getStageBadge(item.lifecycleStage, item.daysToService)}
                          </div>

                          <div className="eam-feed-name">{item.name}</div>

                          <div className="eam-feed-meta">
                            <span>📍 {item.facility.split(',')[0]}</span>
                            <span>•</span>
                            <span>👤 {item.custodian}</span>
                            {!item.custodianAcknowledged && item.lifecycleStage !== 'disposed' && (
                              <span className="badge warn" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                ✍️ Sign Pending
                              </span>
                            )}
                          </div>

                          <div className="eam-feed-metrics">
                            <div>
                              {roleConfig.canViewFinancialLedger ? (
                                <span>
                                  NBV: <strong style={{ color: 'var(--brand-slate-900)' }}>
                                    {item.lifecycleStage === 'disposed' ? '৳0 (Retired)' : fmtBdtShort(f.netBookValue)}
                                  </strong>{' '}
                                  <span style={{ color: 'var(--brand-slate-400)', fontFamily: 'monospace', fontSize: '10px' }}>
                                    ({item.depreciationMethod})
                                  </span>
                                </span>
                              ) : (
                                <span style={{ color: 'var(--brand-slate-500)' }}>S/N: {item.serialNo}</span>
                              )}
                            </div>

                            {item.lifecycleStage !== 'disposed' && item.lifecycleStage !== 'decommissioned' ? (
                              <div className="eam-health-pill" style={{ color: healthColor }}>
                                <div className="eam-mini-bar">
                                  <div
                                    className="eam-mini-bar-fill"
                                    style={{ width: `${item.healthScore}%`, background: healthColor }}
                                  />
                                </div>
                                <span>{item.healthScore}%</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>EoL Stage</span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT PANEL: 360° ASSET COCKPIT HERO & DOSSIER */}
              {selectedAsset && selectedFinancials && (
                <div className={`eam-dossier-shell ${mobileTab === 'list' ? 'eam-mobile-hidden' : ''}`}>
                  {/* Executive Navy-Crimson Hero Header */}
                  <div className="eam-dossier-hero">
                    <div className="eam-hero-top">
                      <div className="eam-hero-badges">
                        <span className="eam-hero-tag">🏷️ {selectedAsset.tag}</span>
                        <span className="eam-hero-sap">{selectedAsset.sapAssetNo}</span>
                        {getCriticalityBadge(selectedAsset.criticality)}
                        {getStageBadge(selectedAsset.lifecycleStage, selectedAsset.daysToService)}
                      </div>

                      <button
                        type="button"
                        className="eam-hero-qr-btn"
                        onClick={() => setShowPassportModal(true)}
                      >
                        <QrCode size={14} /> {t('Metal QR Passport', 'কিউআর পাসপোর্ট', lang)}
                      </button>
                    </div>

                    <h3 className="eam-hero-title">{selectedAsset.name}</h3>
                    <div className="eam-hero-sub">
                      <span>🏭 {selectedAsset.oem} ({selectedAsset.modelNo})</span>
                      <span>•</span>
                      <span>S/N: {selectedAsset.serialNo}</span>
                      <span>•</span>
                      <span>📍 {selectedAsset.facility} ({selectedAsset.functionalLocation})</span>
                    </div>

                    {/* 4 Telemetry Micro-Tiles */}
                    <div className="eam-hero-telemetry">
                      <div className="eam-hero-tile">
                        <div className="eam-hero-tile-lbl">
                          {roleConfig.canViewFinancialLedger
                            ? t('Carrying NBV', 'বর্তমান বইমূল্য', lang)
                            : t('Commissioned Date', 'কমিশনিং তারিখ', lang)}
                        </div>
                        <div className="eam-hero-tile-val" style={{ color: '#34D399' }}>
                          {roleConfig.canViewFinancialLedger
                            ? selectedAsset.lifecycleStage === 'disposed'
                              ? '৳0 (Retired)'
                              : fmtBdtShort(selectedFinancials.netBookValue)
                            : selectedAsset.commissioningDate}
                        </div>
                        <div className="eam-hero-tile-sub">
                          {roleConfig.canViewFinancialLedger
                            ? `${selectedAsset.depreciationMethod} · Gross ${fmtBdtShort(selectedFinancials.grossCapitalizedCost)}`
                            : selectedAsset.glCostCenter}
                        </div>
                      </div>

                      <div className="eam-hero-tile">
                        <div className="eam-hero-tile-lbl">{t('Health & RUL', 'স্বাস্থ্য ও অবশিষ্ট আয়ু', lang)}</div>
                        <div className="eam-hero-tile-val">
                          {selectedAsset.lifecycleStage === 'disposed'
                            ? 'Archived'
                            : `${selectedAsset.healthScore}% Health`}
                        </div>
                        <div className="eam-hero-tile-sub">
                          RUL: {selectedFinancials.remainingUsefulLifeYears} yrs ({selectedAsset.runtimeHours.toLocaleString()}h)
                        </div>
                      </div>

                      <div className="eam-hero-tile">
                        <div className="eam-hero-tile-lbl">{t('Statutory Audit', 'পরবর্তী ক্যালিব্রেশন', lang)}</div>
                        <div
                          className="eam-hero-tile-val"
                          style={{
                            color:
                              selectedAsset.daysToService > 0 && selectedAsset.daysToService <= 20
                                ? '#FCA5A5'
                                : '#FFFFFF',
                          }}
                        >
                          {selectedAsset.lifecycleStage === 'disposed'
                            ? 'Retired'
                            : `${selectedAsset.daysToService} ${t('days', 'দিন', lang)}`}
                        </div>
                        <div className="eam-hero-tile-sub">
                          {selectedAsset.regulatoryAuthority || 'ISO 55001'} · {selectedAsset.nextServiceDate}
                        </div>
                      </div>

                      <div className="eam-hero-tile">
                        <div className="eam-hero-tile-lbl">{t('Current Custodian', 'হেফাজতকারী কর্মকর্তা', lang)}</div>
                        <div className="eam-hero-tile-val" style={{ fontSize: '12.5px' }}>
                          {selectedAsset.custodian}
                        </div>
                        <div
                          className="eam-hero-tile-sub"
                          style={{ color: selectedAsset.custodianAcknowledged ? '#6EE7B7' : '#FDE047' }}
                        >
                          {selectedAsset.custodianAcknowledged ? '✓ Handover E-Signed' : '⏳ Signature Pending'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dossier Body */}
                  <div className="eam-dossier-body">
                    {/* Mobile Back Button */}
                    <button
                      type="button"
                      className="btn-outline mobile-view-toggle"
                      style={{ padding: '6px 12px', fontSize: '11.5px', width: 'auto', marginBottom: '12px' }}
                      onClick={() => setMobileTab('list')}
                    >
                      <ArrowLeft size={13} /> {t('Back to Asset Feed', 'সম্পদ তালিকায় ফিরুন', lang)}
                    </button>

                    {/* Smart Contextual Next-Action Guidance Bar */}
                    {renderSmartNextAction()}

                    {/* Connected 8-Stage Cradle-to-Grave Stepper */}
                    <AssetLifecycleStepper asset={selectedAsset} lang={lang} />

                    {/* Clean Segmented Dossier Sub-Tabs */}
                    <div className="eam-subtabs">
                      <button
                        type="button"
                        className={`eam-subtab ${inspectorTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setInspectorTab('overview')}
                      >
                        <Eye size={13} /> {t('Specs & Controls', 'বিবরণ ও নিয়ন্ত্রণ', lang)}
                      </button>
                      <button
                        type="button"
                        className={`eam-subtab ${inspectorTab === 'timeline' ? 'active' : ''}`}
                        onClick={() => setInspectorTab('timeline')}
                      >
                        <History size={13} /> {t('Audit Trail', 'জীবনচক্র খতিয়ান', lang)} ({selectedAsset.lifecycleEvents.length})
                      </button>
                      <button
                        type="button"
                        className={`eam-subtab ${inspectorTab === 'custody' ? 'active' : ''}`}
                        onClick={() => setInspectorTab('custody')}
                      >
                        <UserCheck size={13} /> {t('Custody Chain', 'হেফাজত ইতিহাস', lang)} ({selectedAsset.custodyHistory.length})
                      </button>
                      {!roleConfig.isSelfServiceOnly && (
                        <button
                          type="button"
                          className={`eam-subtab ${inspectorTab === 'spares' ? 'active' : ''}`}
                          onClick={() => setInspectorTab('spares')}
                        >
                          <Package size={13} /> {t('BOM Spares', 'খুচরা যন্ত্রাংশ', lang)} ({selectedAsset.spares.length})
                        </button>
                      )}
                    </div>

                    {/* SUB-TAB A: OVERVIEW, SPECS & ROLE-GATED CONTROLS */}
                    {inspectorTab === 'overview' && (
                      <div>
                        <div className="eam-spec-box" style={{ marginBottom: '10px' }}>
                          <div className="eam-spec-lbl">
                            {t('Technical Operating Specifications & Duty Rating', 'প্রযুক্তিগত বৈশিষ্ট্য ও অপারেটিং স্পেসিফিকেশন', lang)}
                          </div>
                          <div className="eam-spec-val" style={{ fontWeight: 600, lineHeight: 1.45 }}>
                            {selectedAsset.specs}
                          </div>
                        </div>

                        <div className="eam-info-grid-2">
                          <div className="eam-spec-box">
                            <div className="eam-spec-lbl">{t('Functional Placement & GL Cost Center', 'অবস্থান ও জিএল কস্ট সেন্টার', lang)}</div>
                            <div className="eam-spec-val">{selectedAsset.functionalLocation}</div>
                            <div className="eam-spec-sub" style={{ fontFamily: 'monospace', color: 'var(--brand-crimson)', fontWeight: 700 }}>
                              {selectedAsset.glCostCenter} • {selectedAsset.department}
                            </div>
                          </div>

                          <div className="eam-spec-box">
                            <div className="eam-spec-lbl">{t('Procurement, Commissioning & AMC', 'ক্রয়, কমিশনিং ও এএমসি', lang)}</div>
                            <div className="eam-spec-val">
                              {t('Commissioned:', 'কমিশনিং:', lang)} {selectedAsset.commissioningDate}
                            </div>
                            <div className="eam-spec-sub">
                              {selectedAsset.amcVendor ? `AMC: ${selectedAsset.amcVendor}` : `Warranty Expiry: ${selectedAsset.warrantyExpiry}`}
                            </div>
                          </div>
                        </div>

                        {/* Financial Snapshot Grid */}
                        {roleConfig.canViewFinancialLedger && (
                          <div className="eam-info-grid-3">
                            <div className="eam-spec-box">
                              <div className="eam-spec-lbl">{t('Gross Capitalized Cost', 'মোট মূলধন ব্যয়', lang)}</div>
                              <div className="eam-spec-val">৳{selectedFinancials.grossCapitalizedCost.toLocaleString()}</div>
                              <div className="eam-spec-sub">Salvage: ৳{selectedAsset.salvageValue.toLocaleString()}</div>
                            </div>
                            <div className="eam-spec-box">
                              <div className="eam-spec-lbl">{t('Carrying Net Book Value', 'বর্তমান বইমূল্য (NBV)', lang)}</div>
                              <div className="eam-spec-val" style={{ color: '#059669' }}>
                                {selectedAsset.lifecycleStage === 'disposed'
                                  ? '৳0 (Retired)'
                                  : `৳${selectedFinancials.netBookValue.toLocaleString()}`}
                              </div>
                              <div className="eam-spec-sub">
                                -{fmtBdtShort(selectedFinancials.annualDepreciation)}/yr ({selectedAsset.depreciationMethod})
                              </div>
                            </div>
                            <div className="eam-spec-box">
                              <div className="eam-spec-lbl">{t('Lifetime TCO & OPEX %', 'মোট জীবনচক্র ব্যয় (TCO)', lang)}</div>
                              <div
                                className="eam-spec-val"
                                style={{ color: selectedFinancials.repairToCapexRatioPct >= 50 ? '#DC2626' : undefined }}
                              >
                                ৳{selectedFinancials.totalCostOfOwnership.toLocaleString()}
                              </div>
                              <div className="eam-spec-sub">
                                Repair/CAPEX: <strong>{selectedFinancials.repairToCapexRatioPct}%</strong>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Active Deficiency Alert */}
                        {selectedAsset.defectQuery && (
                          <div
                            style={{
                              background: 'rgba(220, 38, 38, 0.08)',
                              border: '1.5px solid rgba(220, 38, 38, 0.32)',
                              borderRadius: '9px',
                              padding: '11px 13px',
                              marginBottom: '12px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#DC2626', fontWeight: 800, fontSize: '12px' }}>
                              <AlertTriangle size={14} />
                              <span>{t('Active Maintenance / Calibration Deficiency', 'সক্রিয় ত্রুটি / ক্যালিব্রেশন আপত্তি', lang)}</span>
                            </div>
                            <div style={{ fontSize: '11.5px', marginTop: '4px' }}>
                              <strong>{selectedAsset.defectQuery.reason}:</strong> {selectedAsset.defectQuery.observation}
                            </div>
                            <div style={{ fontSize: '11px', color: '#059669', marginTop: '3px', fontWeight: 700 }}>
                              ➔ {selectedAsset.defectQuery.improvementsRequired}
                            </div>
                          </div>
                        )}

                        {/* Retired & Archived Summary Box */}
                        {selectedAsset.disposalDossier && selectedAsset.lifecycleStage === 'disposed' && (
                          <div className="eam-spec-box" style={{ borderLeft: '4px solid var(--brand-slate-500)', marginBottom: '12px' }}>
                            <div style={{ fontWeight: 800, fontSize: '12.5px', marginBottom: '4px' }}>
                              🏛️ {t('Stage-8 Retired & Archived Dossier', 'নিষ্পত্তিকৃত সংবিধিবদ্ধ আর্কাইভ রেকর্ড', lang)} ({selectedAsset.disposalDossier.sapRetirementVoucher})
                            </div>
                            <div style={{ fontSize: '11.5px' }}>
                              Channel: <strong>{selectedAsset.disposalDossier.disposalMethod}</strong> • Counterparty:{' '}
                              <strong>{selectedAsset.disposalDossier.buyerOrVendor}</strong>
                            </div>
                            <div style={{ fontSize: '11.5px', marginTop: '3px' }}>
                              Proceeds: <strong>৳{selectedAsset.disposalDossier.salvageProceedsBdt?.toLocaleString()}</strong> • IAS 16 Gain/Loss:{' '}
                              <strong style={{ color: (selectedAsset.disposalDossier.gainOrLossBdt || 0) >= 0 ? '#059669' : '#DC2626' }}>
                                {(selectedAsset.disposalDossier.gainOrLossBdt || 0) >= 0
                                  ? `+৳${selectedAsset.disposalDossier.gainOrLossBdt?.toLocaleString()}`
                                  : `-৳${Math.abs(selectedAsset.disposalDossier.gainOrLossBdt || 0).toLocaleString()}`}
                              </strong>
                            </div>
                          </div>
                        )}

                        {/* Organized Lifecycle Action Toolbar */}
                        <div className="eam-action-section">
                          <div className="eam-action-section-lbl">
                            {t('Lifecycle Operations & Governance Controls', 'জীবনচক্র অপারেশন ও গভর্ন্যান্স নিয়ন্ত্রণ', lang)}
                          </div>
                          <div className="eam-actions-grid">
                            {roleConfig.canCertifyCalibration &&
                              selectedAsset.lifecycleStage !== 'disposed' &&
                              selectedAsset.lifecycleStage !== 'decommissioned' && (
                                <button
                                  type="button"
                                  className="btn-primary"
                                  onClick={() => {
                                    certifyAssetDirect(selectedAsset.id, currentPersona.name, currentPersona.label);
                                    showToast(
                                      t(
                                        `✓ Calibration & reliability certified for ${selectedAsset.tag}. Next cycle set to ${selectedAsset.calibrationCycleDays}d.`,
                                        `✓ ${selectedAsset.tag}-এর ক্যালিব্রেশন প্রত্যয়ন সম্পন্ন হয়েছে।`,
                                        lang
                                      ),
                                      'success'
                                    );
                                  }}
                                >
                                  <CheckCircle size={14} /> {t('Certify Calibration / PM', 'ক্যালিব্রেশন প্রত্যয়ন', lang)}
                                </button>
                              )}

                            {roleConfig.canManageWorkOrders &&
                              selectedAsset.lifecycleStage !== 'disposed' &&
                              selectedAsset.lifecycleStage !== 'decommissioned' && (
                                <button type="button" className="btn-outline" onClick={() => setShowWorkOrderModal(true)}>
                                  <Wrench size={14} /> {t('Dispatch Work Order', 'কার্যাদেশ জারি', lang)}
                                </button>
                              )}

                            {roleConfig.canTransferCustody &&
                              selectedAsset.lifecycleStage !== 'disposed' &&
                              selectedAsset.lifecycleStage !== 'decommissioned' && (
                                <button type="button" className="btn-outline" onClick={() => setShowTransferModal(true)}>
                                  <ArrowRightLeft size={14} /> {t('Transfer Custody / Site', 'হস্তান্তর / গেট পাস', lang)}
                                </button>
                              )}

                            {roleConfig.canViewFinancialLedger && (
                              <button type="button" className="btn-outline" onClick={() => setScheduleTargetAsset(selectedAsset)}>
                                <DollarSign size={14} /> {t('IAS 16 Depreciation Table', 'অবচয় তফসিল', lang)}
                              </button>
                            )}

                            {selectedAsset.lifecycleStage !== 'disposed' &&
                              selectedAsset.lifecycleStage !== 'decommissioned' && (
                                <button
                                  type="button"
                                  className="btn-outline"
                                  style={{ borderColor: 'rgba(220,38,38,0.45)', color: '#DC2626' }}
                                  onClick={() => setShowRejectModal(true)}
                                >
                                  <RotateCcw size={14} />
                                  {roleConfig.isSelfServiceOnly
                                    ? t('Report Defect', 'ত্রুটি রিপোর্ট করুন', lang)
                                    : t('Flag Deficiency', 'ত্রুটি ফ্ল্যাগ করুন', lang)}
                                </button>
                              )}

                            {roleConfig.canInitiateDecommission &&
                              selectedAsset.lifecycleStage !== 'decommissioned' &&
                              selectedAsset.lifecycleStage !== 'disposed' && (
                                <button
                                  type="button"
                                  className="btn-outline-danger"
                                  onClick={() => setShowDecommissionModal(true)}
                                >
                                  <Archive size={14} /> {t('Condemn / Decommission', 'অকেজো ঘোষণা', lang)}
                                </button>
                              )}

                            {roleConfig.canAuthorizeWriteOff && selectedAsset.lifecycleStage === 'decommissioned' && (
                              <button
                                type="button"
                                className="btn-gold"
                                style={{ fontWeight: 800 }}
                                onClick={() => setDisposalTargetAsset(selectedAsset)}
                              >
                                👑 {t('Sanction Write-Off & Dispose', 'চূড়ান্ত অবলোপন অনুমোদন', lang)}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB B: IMMUTABLE CRADLE-TO-GRAVE AUDIT TIMELINE */}
                    {inspectorTab === 'timeline' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                        {selectedAsset.lifecycleEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="eam-spec-box"
                            style={{ borderLeft: '3.5px solid var(--brand-crimson)' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 800, fontSize: '12.5px', color: 'var(--brand-slate-900)' }}>{ev.title}</span>
                                {typeof ev.financialDeltaBdt === 'number' && ev.financialDeltaBdt !== 0 && (
                                  <span className={`badge ${ev.financialDeltaBdt > 0 ? 'info' : 'warn'}`} style={{ fontSize: '10px' }}>
                                    {ev.financialDeltaBdt > 0
                                      ? `CAPEX +৳${ev.financialDeltaBdt.toLocaleString()}`
                                      : `৳${ev.financialDeltaBdt.toLocaleString()}`}
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={11} /> {ev.timestamp}
                              </span>
                            </div>

                            <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-600)', marginTop: '4px', lineHeight: 1.45 }}>
                              {ev.notes}
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '6px',
                                marginTop: '7px',
                                paddingTop: '6px',
                                borderTop: '1px dashed var(--brand-slate-200)',
                                fontSize: '10.5px',
                                color: 'var(--brand-slate-500)',
                              }}
                            >
                              <span>
                                Actor: <strong>{ev.actor}</strong> ({ev.actorRole})
                              </span>
                              <span style={{ fontFamily: 'monospace', color: '#059669', fontWeight: 700 }}>
                                {ev.sapRef ? `${ev.sapRef} · ` : ''}
                                {ev.hash.slice(0, 22)}...
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SUB-TAB C: CUSTODY & LOCATION CHAIN */}
                    {inspectorTab === 'custody' && (
                      <div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '12px' }}>
                          {selectedAsset.custodyHistory.map((ch, idx) => {
                            const isCurrent = !ch.returnedDate;
                            return (
                              <div
                                key={ch.id}
                                className="eam-spec-box"
                                style={{
                                  border: isCurrent ? '1.5px solid #059669' : undefined,
                                  background: isCurrent ? 'rgba(5, 150, 105, 0.05)' : undefined,
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                  <strong style={{ fontSize: '12.5px' }}>
                                    #{idx + 1} · {ch.custodianName} {ch.custodianEmpId ? `(${ch.custodianEmpId})` : ''}
                                  </strong>
                                  <span className={`badge ${isCurrent ? 'success' : 'info'}`}>
                                    {isCurrent ? t('Current Holder', 'বর্তমান হেফাজতকারী', lang) : `Returned: ${ch.returnedDate}`}
                                  </span>
                                </div>
                                <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '3px' }}>
                                  📍 {ch.facility} — {ch.functionalLocation} ({ch.department})
                                </div>
                                <div style={{ fontSize: '11px', marginTop: '4px' }}>
                                  Assigned: <strong>{ch.assignedDate}</strong>
                                  {ch.gatePassRef ? ` • Gate Pass: ${ch.gatePassRef}` : ''} •{' '}
                                  {ch.acknowledged ? (
                                    <span style={{ color: '#059669', fontWeight: 700 }}>
                                      ✓ E-Signed {ch.acknowledgedAt ? `(${ch.acknowledgedAt})` : ''}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#D97706', fontWeight: 700 }}>⏳ Signature Pending</span>
                                  )}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', marginTop: '2px' }}>
                                  Condition: {ch.conditionOnHandover}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {roleConfig.canTransferCustody &&
                          selectedAsset.lifecycleStage !== 'disposed' &&
                          selectedAsset.lifecycleStage !== 'decommissioned' && (
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ width: '100%', justifyContent: 'center' }}
                              onClick={() => setShowTransferModal(true)}
                            >
                              <ArrowRightLeft size={14} /> {t('Initiate New Custody / Site Gate Pass Transfer', 'নতুন হস্তান্তর বা সাইট স্থানান্তর করুন', lang)}
                            </button>
                          )}
                      </div>
                    )}

                    {/* SUB-TAB D: BOM CRITICAL SPARE PARTS */}
                    {inspectorTab === 'spares' && (
                      <div>
                        {selectedAsset.spares.length === 0 ? (
                          <div style={{ padding: '24px', textAlign: 'center', fontSize: '12.5px', color: 'var(--brand-slate-400)' }}>
                            {t('No dedicated BOM sub-assembly spares registered for this unit (sealed/IT equipment).', 'এই সরঞ্জামের জন্য আলাদা কোনো খুচরা যন্ত্রাংশ বিওএম তালিকাভুক্ত নেই।', lang)}
                          </div>
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
                                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--brand-slate-900)' }}>{sp.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontFamily: 'monospace', marginTop: '2px' }}>
                                      Part: {sp.partNo} • Unit Cost: ৳{sp.unitCostBdt.toLocaleString()} • Lead: {sp.leadTimeDays}d
                                    </div>
                                    <div style={{ marginTop: '5px' }}>
                                      <span className={`badge ${isLow ? 'danger' : 'success'}`}>
                                        Stock: {sp.stockQty} pcs {isLow ? `(<= Min ${sp.minReorderQty} Reorder!)` : '(Healthy)'}
                                      </span>
                                    </div>
                                  </div>

                                  {roleConfig.canManageWorkOrders && (
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      <button
                                        type="button"
                                        className="btn-outline"
                                        style={{ fontSize: '11.5px', padding: '6px 11px' }}
                                        disabled={sp.stockQty <= 0}
                                        onClick={() => {
                                          consumeSparePart(selectedAsset.id, sp.id, currentPersona.name, currentPersona.label);
                                          showToast(t(`Issued 1x ${sp.partNo} to ${selectedAsset.tag} maintenance.`, 'খুচরা যন্ত্রাংশ ইস্যু করা হয়েছে।', lang), 'info');
                                        }}
                                      >
                                        Issue 1x
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-primary"
                                        style={{ fontSize: '11.5px', padding: '6px 11px' }}
                                        onClick={() => {
                                          restockSparePart(selectedAsset.id, sp.id, 3);
                                          showToast(t(`Restocked +3 pcs of ${sp.partNo} in Plant Store.`, 'স্টোরে +৩টি যন্ত্রাংশ যুক্ত হয়েছে।', lang), 'success');
                                        }}
                                      >
                                        +3 Restock
                                      </button>
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
              )}
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
                  {t('CMMS Work Orders & Statutory Calibration Compliance Board', 'রক্ষণাবেক্ষণ কার্যাদেশ ও সংবিধিবদ্ধ ক্যালিব্রেশন বোর্ড', lang)}
                </div>
                <div className="card-subtitle">
                  {t('BSTI · Department of Explosives (DoE) · ASME Sec VIII · BRTA · OEM Warranty Tracking', 'বিএসটিআই · বিস্ফোরক পরিদপ্তর · এএসএমই · বিআরটিএ ফিটনেস ও ওয়ারেন্টি ক্লেইম ট্র্যাকিং', lang)}
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
                  📐 {t('Statutory CAL', 'ক্যালিব্রেশন', lang)}
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
                          ? '#059669'
                          : wo.priority === 'critical'
                          ? '#DC2626'
                          : '#D97706'
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
                          🏷️ {wo.assetTag} <ExternalLink size={10} style={{ display: 'inline', marginLeft: '2px' }} />
                        </button>
                        {wo.lotoPermitRef && (
                          <span className="badge danger" style={{ fontSize: '10px' }}>🔒 {wo.lotoPermitRef}</span>
                        )}
                        {wo.coveredByWarranty && (
                          <span className="badge success" style={{ fontSize: '10px' }}>🛡️ OEM Warranty (৳0)</span>
                        )}
                        {wo.isCapexOverhaul && (
                          <span className="badge gold" style={{ fontSize: '10px' }}>💎 IAS 16 Capitalized Overhaul</span>
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
          TAB 3: IAS 16 FIXED ASSET VALUATION, DEPRECIATION & TCO LEDGER
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'financials' && roleConfig.canViewFinancialLedger && (
        <div className="card">
          <div className="card-hd" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div className="card-hd-left">
              <div className="card-hd-icon"><DollarSign size={16} /></div>
              <div>
                <div className="card-title">
                  {t('SAP S/4HANA FI-AA Fixed Asset Valuation, IAS 16 Depreciation & TCO Ledger', 'স্থায়ী সম্পদ মূল্যায়ন, অবচয় তফসিল (IAS 16) ও মোট জীবনচক্র ব্যয় (TCO) খতিয়ান', lang)}
                </div>
                <div className="card-subtitle">
                  {t(
                    'Straight-Line (SLM), Declining Balance (WDV) & Units-of-Production (UoP) • Automated 50% Repair-to-CAPEX EoL Watch',
                    'সরলরৈখিক (SLM), ক্রমহ্রাসমান (WDV) ও উৎপাদন-ঘণ্টা (UoP) অবচয় পদ্ধতি এবং ৫০% মেরামত-সীমা সতর্কতা',
                    lang
                  )}
                </div>
              </div>
            </div>

            <button type="button" className="btn-primary" onClick={handleExportMasterLedgerCsv}>
              <Download size={14} /> {t('Export SAP FI-AA Ledger (CSV)', 'খতিয়ান ডাউনলোড (CSV)', lang)}
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
              <strong>Active Capital Base:</strong> ৳{portfolioStats.totalGross.toLocaleString()}
            </span>
            <span>
              <strong>Accumulated Depreciation:</strong>{' '}
              <span style={{ color: '#DC2626', fontWeight: 700 }}>-৳{portfolioStats.totalAccDep.toLocaleString()}</span>
            </span>
            <span>
              <strong>Carrying Net Book Value:</strong>{' '}
              <span style={{ color: '#059669', fontWeight: 800 }}>৳{portfolioStats.totalNbv.toLocaleString()}</span>
            </span>
            <span>
              <strong>Portfolio TCO (CAPEX + OPEX):</strong> ৳{portfolioStats.totalTco.toLocaleString()}
            </span>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('Asset Tag & SAP FI-AA', 'ট্যাগ ও এসএপি কোড', lang)}</th>
                    <th>{t('GL Cost Center', 'কস্ট সেন্টার', lang)}</th>
                    <th>{t('Gross CAPEX', 'মোট মূলধন ব্যয়', lang)}</th>
                    <th>{t('IAS 16 Policy & Yr Dep.', 'পদ্ধতি ও বার্ষিক অবচয়', lang)}</th>
                    <th>{t('Accumulated Dep.', 'পুঞ্জীভূত অবচয়', lang)}</th>
                    <th>{t('Carrying NBV', 'বর্তমান বইমূল্য (NBV)', lang)}</th>
                    <th>{t('Lifetime TCO & OPEX Ratio', 'মোট ব্যয় ও মেরামত %', lang)}</th>
                    <th style={{ textAlign: 'right' }}>{t('Actions', 'পদক্ষেপ', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {roleScopedAssets.map((a) => {
                    const f = calculateAssetFinancials(a);
                    const ratioBarColor =
                      f.repairToCapexRatioPct >= 50 ? '#DC2626' : f.repairToCapexRatioPct >= 30 ? '#D97706' : '#059669';

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
                        <td style={{ fontWeight: 700 }}>৳{f.grossCapitalizedCost.toLocaleString()}</td>
                        <td>
                          <span className="badge info" style={{ fontSize: '10px' }}>{a.depreciationMethod}</span>
                          <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '2px', fontWeight: 600 }}>
                            -৳{f.annualDepreciation.toLocaleString()}/yr
                          </div>
                        </td>
                        <td>৳{f.accumulatedDepreciation.toLocaleString()}</td>
                        <td style={{ fontWeight: 800, color: a.lifecycleStage === 'disposed' ? 'var(--brand-slate-400)' : '#059669' }}>
                          {a.lifecycleStage === 'disposed' ? '৳0 (Retired)' : `৳${f.netBookValue.toLocaleString()}`}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>৳{f.totalCostOfOwnership.toLocaleString()}</div>
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
                              {f.repairToCapexRatioPct}% {f.repairToCapexRatioPct >= 50 ? '⚠️ EoL' : ''}
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
                    {t('Stage 1–3 Asset Acquisition & Replacement Requisition Pipeline', 'নতুন সম্পদ ক্রয় ও প্রতিস্থাপন রিকুইজিশন পাইপলাইন', lang)}
                  </div>
                  <div className="card-subtitle">
                    {t('End-to-end birth tracking: Requisition → Dept Vetting → CFO/Chairman Sanction → Auto-Tag Commissioning', 'আবেদন হতে বিভাগীয় সুপারিশ, চেয়ারম্যান/অর্থ অনুমোদন এবং স্বয়ংক্রিয় অ্যাসেট ট্যাগ কমিশনিং', lang)}
                  </div>
                </div>
              </div>
              <button type="button" className="btn-primary" onClick={() => setShowRequisitionModal(true)}>
                <Plus size={14} /> {t('New Asset Requisition', 'নতুন রিকুইজিশন দাখিল', lang)}
              </button>
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
                            Est. CAPEX: ৳{req.estimatedCapexBdt.toLocaleString()}
                          </span>
                        </div>

                        <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--brand-slate-900)' }}>{req.title}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                          Requester: <strong>{req.requestedBy}</strong> ({req.department}) • Deployment: <strong>{req.facility}</strong>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', marginTop: '3px' }}>
                          {req.justification}
                        </div>

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
                                  ? t('👑 Sanction CAPEX Budget', '👑 বাজেট চূড়ান্ত অনুমোদন', lang)
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
                          <span className="badge success">✓ Completed ({trf.completedAt})</span>
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
                  <div className="card-title">{t('Stage-7 Condemned Assets Pending Write-Off & Disposal', 'পর্যায়-৭: অকেজো ঘোষিত সম্পদ ও প্রাক-অবলোপন যাচাইকরণ তালিকা', lang)}</div>
                  <div className="card-subtitle">
                    {t(
                      'Mandatory 4-Point Pre-Disposal Checklist (Engineering Survey · DoE Gas-Free / NIST Data Wipe · Spares Harvest · CFO Audit)',
                      'চূড়ান্ত নিলাম বা অবলোপনের পূর্বে ৪-দফা কারিগরি, পরিবেশগত ও আর্থিক ছাড়পত্র বাধ্যতামূলক',
                      lang
                    )}
                  </div>
                </div>
              </div>
              <span className="badge danger">{decommissionedAssets.length} Pending Write-Off</span>
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
                              <span className="eam-tag-mono">🏷️ {a.tag}</span>
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
                            <div>Orig. CAPEX: <strong>৳{fin.grossCapitalizedCost.toLocaleString()}</strong></div>
                            <div>Carrying NBV: <strong style={{ color: '#DC2626' }}>৳{fin.netBookValue.toLocaleString()}</strong></div>
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
                                      color: checked ? '#059669' : 'var(--brand-slate-600)',
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
                            🔒 Segregation of Duties: Final balance-sheet write-off requires <strong>Chairman & MD</strong> or <strong>CFO / Head of Finance</strong> sanction.
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
                                👑 {t('Authorize Write-Off & Execute Disposal', 'চূড়ান্ত অবলোপন ও নিলাম নিষ্পত্তি', lang)}
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
                      <th>{t('SAP Retirement Voucher', 'এসএপি ভাউচার ও অনুমোদনকারী', lang)}</th>
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
                          <td>৳{(d?.netBookValueAtDisposal || 0).toLocaleString()}</td>
                          <td style={{ fontWeight: 700 }}>৳{(d?.salvageProceedsBdt || 0).toLocaleString()}</td>
                          <td>
                            <span className={`badge ${gl >= 0 ? 'success' : 'danger'}`} style={{ fontWeight: 800 }}>
                              {gl >= 0 ? `+৳${gl.toLocaleString()} Gain` : `-৳${Math.abs(gl).toLocaleString()} Loss`}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '11.5px', color: '#0284C7' }}>
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
              `✓ Asset ${created.tag} (${created.sapAssetNo}) capitalized in SAP FI-AA with QR passport!`,
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
              `⚠️ Condemnation survey logged. Asset moved to Stage-7 Decommissioned Write-Off Queue.`,
              `⚠️ অকেজো জরিপ সম্পন্ন। চূড়ান্ত অবলোপনের তালিকায় স্থানান্তরিত।`,
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
                `👑 Write-Off Sanctioned! SAP Voucher ${res.sapVoucher} posted (${res.gainOrLoss >= 0 ? `+৳${res.gainOrLoss.toLocaleString()} Gain` : `-৳${Math.abs(res.gainOrLoss).toLocaleString()} Loss`}). Locked in 10-Yr Archive.`,
                `👑 অবলোপন অনুমোদিত! এসএপি ভাউচার ${res.sapVoucher} পোস্ট ও ১০-বছরের আর্কাইভে সংরক্ষিত।`,
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
