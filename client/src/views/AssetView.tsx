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
} from 'lucide-react';

type MainModuleTab = 'register' | 'maintenance' | 'financials' | 'transfers' | 'disposal';
type InspectorSubTab = 'overview' | 'timeline' | 'custody' | 'spares';

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

  // Primary Module Tab & Inspector Sub-Tab
  const [activeTab, setActiveTab] = useState<MainModuleTab>('register');
  const [inspectorTab, setInspectorTab] = useState<InspectorSubTab>('overview');
  const [mobileTab, setMobileTab] = useState<'list' | 'detail'>('list');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'all' | AssetCategory>(roleConfig.defaultCategory);
  const [facilityFilter, setFacilityFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('active_all');
  const [woFilter, setWoFilter] = useState<'all' | 'open' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

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

      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.tag.toLowerCase().includes(q) ||
        a.sapAssetNo.toLowerCase().includes(q) ||
        a.serialNo.toLowerCase().includes(q) ||
        a.custodian.toLowerCase().includes(q) ||
        a.functionalLocation.toLowerCase().includes(q);

      return matchesCat && matchesSite && matchesStage && matchesSearch;
    });
  }, [roleScopedAssets, categoryFilter, facilityFilter, stageFilter, searchTerm]);

  // Keep selectedAsset synchronized with live store updates
  const selectedAsset = useMemo(() => {
    const found = roleScopedAssets.find((a) => a.id === selectedAssetId);
    return found || filteredAssets[0] || roleScopedAssets[0] || null;
  }, [roleScopedAssets, filteredAssets, selectedAssetId]);

  useEffect(() => {
    if (selectedAsset && selectedAsset.id !== selectedAssetId) {
      setSelectedAssetId(selectedAsset.id);
    }
  }, [selectedAsset, selectedAssetId]);

  // Scoped Work Orders & Requisitions
  const visibleWorkOrders = useMemo(() => {
    const base = roleConfig.isSelfServiceOnly
      ? workOrders.filter((w) => roleScopedAssets.some((a) => a.id === w.assetId))
      : workOrders;
    if (woFilter === 'open') return base.filter((w) => w.status !== 'completed');
    if (woFilter === 'completed') return base.filter((w) => w.status === 'completed');
    return base;
  }, [workOrders, roleConfig.isSelfServiceOnly, roleScopedAssets, woFilter]);

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
      (a) => a.lifecycleStage === 'calibration_due' || a.lifecycleStage === 'maintenance' || (a.daysToService > 0 && a.daysToService <= 30)
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

  // Badge Helpers
  const getStageBadge = (stage: LifecycleStage, daysToService?: number) => {
    switch (stage) {
      case 'operational':
        return <span className="badge success">{t('Operational', 'সক্রিয় চালু', lang)}</span>;
      case 'in_stock':
        return <span className="badge info">{t('In Store Pool', 'স্টোর পুলে সংরক্ষিত', lang)}</span>;
      case 'in_transfer':
        return <span className="badge travel">{t('In Transit', 'স্থানান্তরধীন', lang)}</span>;
      case 'calibration_due':
        return (
          <span className="badge danger">
            {t(`Calibration Due (${daysToService ?? 10}d)`, `ক্যালিব্রেশন বাকি (${daysToService ?? 10} দিন)`, lang)}
          </span>
        );
      case 'maintenance':
        return <span className="badge warn">{t('Under Overhaul', 'মেরামতাধীন', lang)}</span>;
      case 'decommissioned':
        return <span className="badge danger">{t('Condemned (Stage 7)', 'অকেজো (অবলোপন অপেক্ষমাণ)', lang)}</span>;
      case 'disposed':
        return (
          <span className="badge" style={{ background: 'var(--brand-slate-200)', color: 'var(--brand-slate-700)' }}>
            {t('Disposed Archive', 'নিষ্পত্তিকৃত আর্কাইভ', lang)}
          </span>
        );
    }
  };

  const getCriticalityBadge = (crit: AssetRecord['criticality']) => {
    if (crit === 'critical_a') {
      return (
        <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: 'rgba(220,38,38,0.12)', color: '#DC2626' }}>
          Class-A Critical
        </span>
      );
    }
    if (crit === 'essential_b') {
      return (
        <span style={{ fontSize: '9.5px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(217,119,6,0.12)', color: '#D97706' }}>
          Class-B Essential
        </span>
      );
    }
    return (
      <span style={{ fontSize: '9.5px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', background: 'var(--brand-slate-100)', color: 'var(--brand-slate-500)' }}>
        Class-C Standard
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

  return (
    <div className="view-container">
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION HEADER + ROLE-SCOPED GOVERNANCE BANNER
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="section-header" style={{ marginBottom: '12px' }}>
        <div>
          <h2 className="section-title">
            🏗️{' '}
            {roleConfig.isSelfServiceOnly
              ? t('My Assigned Corporate Assets & Equipment Portal', 'আমার বরাদ্দকৃত প্রাতিষ্ঠানিক সম্পদ ও রিকুইজিশন পোর্টাল', lang)
              : t('Enterprise Asset Lifetime Tracking & Reliability System', 'এন্টারপ্রাইজ সম্পদ জীবনচক্র ট্র্যাকিং ও রক্ষণাবেক্ষণ সিস্টেম', lang)}
          </h2>
          <p className="section-subtitle">
            {t(
              'ISO 55001 & ISO 14224 Cradle-to-Grave EAM • IAS 16 Fixed Asset Depreciation • Statutory Calibration • Chain-of-Custody & Disposal Archive',
              'ক্রয় রিকুইজিশন হতে কমিশনিং, হস্তান্তর, ক্যালিব্রেশন, অবচয় হিসাবায়ন (IAS 16) এবং চূড়ান্ত অবলোপন আর্কাইভ পর্যন্ত পূর্ণ জীবনচক্র ব্যবস্থাপনা।',
              lang
            )}
          </p>
        </div>

        <div className="btn-group" style={{ flexWrap: 'wrap' }}>
          {roleConfig.canRegisterAsset && (
            <button className="btn-primary" onClick={() => setShowRegisterModal(true)}>
              <Plus size={15} /> {t('Commission Asset', 'নতুন সম্পদ নিবন্ধন', lang)}
            </button>
          )}
          <button
            className={roleConfig.canRegisterAsset ? 'btn-outline' : 'btn-primary'}
            onClick={() => setShowRequisitionModal(true)}
          >
            <FilePlus size={15} /> {t('Request Asset', 'সম্পদ রিকুইজিশন', lang)}
          </button>
          <button className="btn-outline" onClick={() => setShowScanModal(true)}>
            <Barcode size={15} /> {t('Scan QR / RFID', 'ট্যাগ স্ক্যান', lang)}
          </button>
        </div>
      </div>

      {/* RBAC Role Governance Context Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '10px 14px',
          marginBottom: '16px',
          borderRadius: '10px',
          background: 'var(--brand-card-bg)',
          border: '1px solid var(--brand-slate-200)',
          borderLeft: '4px solid var(--brand-crimson)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: currentPersona.avatarColor,
              color: '#fff',
              fontWeight: 800,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {currentPersona.initials}
          </div>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
              {t(roleConfig.roleTitle, roleConfig.roleTitleBn, lang)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
              {t(roleConfig.scopeDescription, roleConfig.scopeDescriptionBn, lang)}
            </div>
          </div>
        </div>

        <span className="badge gold" style={{ fontWeight: 800, fontSize: '10.5px' }}>
          <Sparkles size={11} /> {t(roleConfig.scopeBadge, roleConfig.scopeBadgeBn, lang)}
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          EXECUTIVE / CUSTODIAN KPI RIBBON
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="kpi-grid mb-5">
        <div className="kpi-card">
          <div className="kpi-label">
            {roleConfig.isSelfServiceOnly
              ? t('My Custody Asset Value', 'আমার হেফাজতে সম্পদের মূল্য', lang)
              : t('Carrying Net Book Value (NBV)', 'বর্তমান নিট বইমূল্য (NBV)', lang)}
          </div>
          <div className="kpi-value text-crimson">
            {portfolioStats.totalNbv >= 10000000
              ? `৳${(portfolioStats.totalNbv / 10000000).toFixed(2)} Cr`
              : `৳${(portfolioStats.totalNbv / 100000).toFixed(2)} L`}
          </div>
          <div className="kpi-sub">
            Gross CAPEX:{' '}
            {portfolioStats.totalGross >= 10000000
              ? `৳${(portfolioStats.totalGross / 10000000).toFixed(2)} Cr`
              : `৳${(portfolioStats.totalGross / 100000).toFixed(2)} L`}{' '}
            ({portfolioStats.activeCount} active)
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">{t('Operational Availability', 'সক্রিয় অপারেশনাল প্রস্তুতি', lang)}</div>
          <div className="kpi-value text-emerald">{portfolioStats.availabilityPct}%</div>
          <div className="kpi-sub">
            {portfolioStats.pendingSignOffs > 0
              ? `${portfolioStats.pendingSignOffs} custody handover sign-off pending`
              : '100% custodian chain verified'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">{t('Calibration & PM Alerts', 'ক্যালিব্রেশন ও সার্ভিস সতর্কতা', lang)}</div>
          <div className="kpi-value" style={{ color: '#D97706' }}>
            {portfolioStats.calAlerts} {t('Assets', 'টি সম্পদ', lang)}
          </div>
          <div className="kpi-sub">
            {workOrders.filter((w) => w.status !== 'completed').length} open CMMS work orders
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            {roleConfig.isSelfServiceOnly
              ? t('My Open Requisitions', 'আমার চলমান রিকুইজিশন', lang)
              : t('Lifecycle TCO & EoL Watch', 'জীবনচক্র ব্যয় (TCO) ও অবলোপন', lang)}
          </div>
          <div className="kpi-value text-blue">
            {roleConfig.isSelfServiceOnly
              ? `${visibleRequisitions.length} Req`
              : `${decommissionedAssets.length} Write-Off`}
          </div>
          <div className="kpi-sub">
            {roleConfig.isSelfServiceOnly
              ? 'Multi-tier approval tracked live'
              : `Accum. Dep: ৳${(portfolioStats.totalAccDep / 10000000).toFixed(2)} Cr · ${disposedAssets.length} Archived`}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          5-MODULE ENTERPRISE LIFECYCLE NAVIGATION TABS
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="pill-tabs" style={{ marginBottom: '18px' }}>
        <button
          type="button"
          className={`pill-tab ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => setActiveTab('register')}
        >
          <Layers size={14} />
          {roleConfig.isSelfServiceOnly
            ? t('My Custody Assets', 'আমার বরাদ্দকৃত সম্পদ', lang)
            : t('1. Asset Register & 360° Dossier', '১. সম্পদ রেজিস্টার ও ৩৬০° ডসিয়ার', lang)}
          <span className="badge info" style={{ fontSize: '9.5px', padding: '1px 6px' }}>{roleScopedAssets.filter((a) => a.lifecycleStage !== 'disposed').length}</span>
        </button>

        <button
          type="button"
          className={`pill-tab ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          <Wrench size={14} />
          {roleConfig.isSelfServiceOnly
            ? t('Service & Defect Logs', 'মেরামত ও ত্রুটি লগ', lang)
            : t('2. PM, Calibration & Work Orders', '২. ক্যালিব্রেশন ও কার্যাদেশ', lang)}
          <span className="badge warn" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
            {visibleWorkOrders.filter((w) => w.status !== 'completed').length}
          </span>
        </button>

        {roleConfig.canViewFinancialLedger && (
          <button
            type="button"
            className={`pill-tab ${activeTab === 'financials' ? 'active' : ''}`}
            onClick={() => setActiveTab('financials')}
          >
            <DollarSign size={14} />
            {t('3. IAS 16 Depreciation & TCO Ledger', '৩. অবচয় (IAS 16) ও আর্থিক খতিয়ান', lang)}
          </button>
        )}

        <button
          type="button"
          className={`pill-tab ${activeTab === 'transfers' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfers')}
        >
          <ArrowRightLeft size={14} />
          {roleConfig.isSelfServiceOnly
            ? t('My Asset Requisitions', 'নতুন সম্পদের আবেদন', lang)
            : t('4. Requisitions & Custody Transfers', '৪. রিকুইজিশন ও স্থানান্তর', lang)}
          <span className="badge info" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
            {visibleRequisitions.filter((r) => r.stage !== 'commissioned' && r.stage !== 'rejected').length}
          </span>
        </button>

        {!roleConfig.isSelfServiceOnly && (
          <button
            type="button"
            className={`pill-tab ${activeTab === 'disposal' ? 'active' : ''}`}
            onClick={() => setActiveTab('disposal')}
          >
            <Archive size={14} />
            {t('5. Condemnation, Write-Off & Archive', '৫. অকেজো ঘোষণা, নিলাম ও আর্কাইভ', lang)}
            {decommissionedAssets.length > 0 && (
              <span className="badge danger" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                {decommissionedAssets.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: MASTER REGISTER & 360° CRADLE-TO-GRAVE DOSSIER
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'register' && (
        <>
          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            {!roleConfig.isSelfServiceOnly && (
              <div className="pill-tabs" style={{ width: 'auto', flex: '1 1 auto' }}>
                <button className={`pill-tab ${categoryFilter === 'all' ? 'active' : ''}`} onClick={() => setCategoryFilter('all')}>
                  {t('All Classes', 'সকল শ্রেণী', lang)}
                </button>
                <button className={`pill-tab ${categoryFilter === 'plant' ? 'active' : ''}`} onClick={() => setCategoryFilter('plant')}>
                  ⚙️ {t('Refinery Plant', 'রিফাইনারি', lang)}
                </button>
                <button className={`pill-tab ${categoryFilter === 'vehicle' ? 'active' : ''}`} onClick={() => setCategoryFilter('vehicle')}>
                  🚛 {t('Fleet & Tankers', 'ফ্লিট ও ট্যাংকার', lang)}
                </button>
                <button className={`pill-tab ${categoryFilter === 'it' ? 'active' : ''}`} onClick={() => setCategoryFilter('it')}>
                  💻 {t('SCADA & IT', 'স্কাডা ও আইটি', lang)}
                </button>
                <button className={`pill-tab ${categoryFilter === 'safety' ? 'active' : ''}`} onClick={() => setCategoryFilter('safety')}>
                  🛡️ {t('Safety / HSE', 'নিরাপত্তা', lang)}
                </button>
                <button className={`pill-tab ${categoryFilter === 'lab' ? 'active' : ''}`} onClick={() => setCategoryFilter('lab')}>
                  🔬 {t('QC Metrology', 'কিউসি ল্যাব', lang)}
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: '1 1 360px', justifyContent: 'flex-end' }}>
              {!roleConfig.isSelfServiceOnly && (
                <>
                  <select
                    className="form-input"
                    style={{ width: 'auto', fontSize: '12px', padding: '6px 10px' }}
                    value={facilityFilter}
                    onChange={(e) => setFacilityFilter(e.target.value)}
                  >
                    <option value="all">{t('All 3 BOGCL Sites', 'সকল স্থাপনা (৩টি)', lang)}</option>
                    <option value="Keraniganj Bitumen Refinery">Keraniganj Refinery</option>
                    <option value="Bashundhara Corporate HQ, Baridhara">Baridhara Corporate HQ</option>
                    <option value="Chattogram Patenga Terminal">Chattogram Marine Terminal</option>
                  </select>

                  <select
                    className="form-input"
                    style={{ width: 'auto', fontSize: '12px', padding: '6px 10px' }}
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                  >
                    <option value="active_all">{t('Active Lifecycle Stages', 'সক্রিয় জীবনচক্র ধাপ', lang)}</option>
                    <option value="operational">Stage 4: Operational</option>
                    <option value="in_stock">Stage 3: Central Store Pool</option>
                    <option value="calibration_due">Stage 6: Calibration Due</option>
                    <option value="maintenance">Stage 6: Under Overhaul</option>
                    <option value="in_transfer">Stage 5: In Transit</option>
                    <option value="decommissioned">Stage 7: Condemned</option>
                    <option value="disposed">Stage 8: Disposed Archive</option>
                    <option value="all">All (Including Disposed Archive)</option>
                  </select>
                </>
              )}

              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--brand-slate-400)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: '30px', fontSize: '12.5px', width: '100%' }}
                  placeholder={t('Search tag, SAP ID, serial, custodian...', 'ট্যাগ, এসএপি কোড বা নাম খুঁজুন...', lang)}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Mobile View Toggle */}
          <div className="mobile-view-toggle">
            <button type="button" className={mobileTab === 'list' ? 'active' : ''} onClick={() => setMobileTab('list')}>
              <Layers size={14} /> {t('Asset List', 'সম্পদ তালিকা', lang)} ({filteredAssets.length})
            </button>
            <button type="button" className={mobileTab === 'detail' ? 'active' : ''} onClick={() => setMobileTab('detail')}>
              <FileText size={14} /> {t('360° Dossier', 'জীবনচক্র বিবরণ', lang)} {selectedAsset ? `(${selectedAsset.tag})` : ''}
            </button>
          </div>

          {/* Split Master-Detail Grid */}
          <div className="responsive-col-2">
            {/* LEFT: Master Asset Table & Mobile Cards */}
            <div className={`card ${mobileTab === 'detail' ? 'mobile-hide' : ''}`}>
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon"><Layers size={16} /></div>
                  <div>
                    <div className="card-title">
                      {roleConfig.isSelfServiceOnly
                        ? t('My Assigned Equipment Custody Register', 'আমার নামে বরাদ্দকৃত সরঞ্জাম তালিকা', lang)
                        : t('ISO 14224 Enterprise Asset Master Register', 'এন্টারপ্রাইজ মূলধনী সম্পদ মাস্টার তালিকা', lang)}
                    </div>
                    <div className="card-subtitle">
                      {t('Click any asset row to inspect its 8-stage lifetime ledger, custody & spares', 'যেকোনো সম্পদে ক্লিক করে পূর্ণ জীবনচক্র ইতিহাস ও অবচয় দেখুন', lang)}
                    </div>
                  </div>
                </div>
                <button
                  className="btn-sm-ghost"
                  onClick={() =>
                    showToast(
                      t('Synchronized SAP S/4HANA FI-AA & Plant SCADA runtime telemetry.', 'এসএপি ও স্কাডা টেলিমেট্রির সাথে সিঙ্ক সম্পন্ন।', lang),
                      'info'
                    )
                  }
                >
                  <RefreshCw size={13} /> {t('Sync SAP/IoT', 'সিঙ্ক', lang)}
                </button>
              </div>

              <div className="card-body" style={{ padding: 0 }}>
                {/* Desktop Table */}
                <div className="assets-desktop-table">
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>{t('Tag / Equipment', 'ট্যাগ ও যন্ত্রপাতি', lang)}</th>
                          <th>{t('Facility & Custodian', 'স্থাপনা ও হেফাজতকারী', lang)}</th>
                          <th>{t('Carrying NBV', 'বর্তমান মূল্য', lang)}</th>
                          <th>{t('Health / Audit', 'স্বাস্থ্য ও অডিট', lang)}</th>
                          <th>{t('Lifecycle Stage', 'জীবনচক্র ধাপ', lang)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssets.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--brand-slate-400)' }}>
                              {t('No assets match the selected filters.', 'কোনো সম্পদ পাওয়া যায়নি।', lang)}
                            </td>
                          </tr>
                        ) : (
                          filteredAssets.map((item) => {
                            const f = calculateAssetFinancials(item);
                            const isSelected = selectedAsset?.id === item.id;
                            return (
                              <tr
                                key={item.id}
                                onClick={() => setSelectedAssetId(item.id)}
                                style={{
                                  cursor: 'pointer',
                                  background: isSelected ? 'rgba(165, 28, 48, 0.06)' : undefined,
                                }}
                              >
                                <td>
                                  <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--brand-slate-900)' }}>{item.name}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--brand-crimson)', fontWeight: 700 }}>
                                      🏷️ {item.tag}
                                    </span>
                                    {getCriticalityBadge(item.criticality)}
                                  </div>
                                </td>
                                <td>
                                  <div style={{ fontSize: '11.5px', fontWeight: 600 }}>{item.facility.split(',')[0]}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>{item.custodian}</span>
                                    {!item.custodianAcknowledged && (
                                      <span className="badge warn" style={{ fontSize: '9px', padding: '0 5px' }}>Sign Pending</span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 800, fontSize: '12.5px' }}>
                                    {item.lifecycleStage === 'disposed' ? '৳0 (Retired)' : `৳${(f.netBookValue / 100000).toFixed(2)}L`}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--brand-slate-400)', fontFamily: 'monospace' }}>
                                    {item.depreciationMethod} · {item.sapAssetNo}
                                  </div>
                                </td>
                                <td>
                                  {item.lifecycleStage === 'disposed' || item.lifecycleStage === 'decommissioned' ? (
                                    <span style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>EoL Stage</span>
                                  ) : (
                                    <>
                                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: item.healthScore >= 85 ? '#059669' : '#D97706' }}>
                                        ♥ {item.healthScore}% Health
                                      </div>
                                      <div style={{ fontSize: '10.5px', color: item.daysToService <= 15 ? '#DC2626' : 'var(--brand-slate-400)', fontWeight: item.daysToService <= 15 ? 700 : 400 }}>
                                        Audit: {item.daysToService}d
                                      </div>
                                    </>
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

                {/* Mobile Cards */}
                <div className="assets-mobile-cards">
                  {filteredAssets.map((item) => {
                    const f = calculateAssetFinancials(item);
                    return (
                      <div
                        key={item.id}
                        className={`asset-mobile-card ${selectedAsset?.id === item.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedAssetId(item.id);
                          setMobileTab('detail');
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '11.5px', color: 'var(--brand-crimson)' }}>
                            🏷️ {item.tag}
                          </span>
                          {getStageBadge(item.lifecycleStage, item.daysToService)}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--brand-slate-900)', marginBottom: '3px' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginBottom: '6px' }}>
                          📍 {item.facility} • 👤 {item.custodian}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', borderTop: '1px solid var(--brand-slate-200)', paddingTop: '6px' }}>
                          <span>NBV: <strong>৳{(f.netBookValue / 100000).toFixed(2)}L</strong> ({item.depreciationMethod})</span>
                          <span style={{ fontWeight: 700, color: item.daysToService <= 15 ? '#DC2626' : '#059669' }}>
                            Health {item.healthScore}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: 360° Asset Lifetime Inspector */}
            {selectedAsset && selectedFinancials && (
              <div className={`card ${mobileTab === 'list' ? 'mobile-hide' : ''}`}>
                <div className="card-hd">
                  <div className="card-hd-left">
                    <div className="card-hd-icon"><Barcode size={16} /></div>
                    <div>
                      <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span>{selectedAsset.tag}</span>
                        <span style={{ fontSize: '10.5px', fontFamily: 'monospace', color: 'var(--brand-slate-400)' }}>
                          ({selectedAsset.sapAssetNo})
                        </span>
                      </div>
                      <div className="card-subtitle">{selectedAsset.name}</div>
                    </div>
                  </div>
                  {getStageBadge(selectedAsset.lifecycleStage, selectedAsset.daysToService)}
                </div>

                <div className="card-body">
                  {/* Mobile Back */}
                  <div style={{ marginBottom: '10px' }}>
                    <button
                      type="button"
                      className="btn-outline mobile-view-toggle"
                      style={{ padding: '6px 12px', fontSize: '11.5px', width: 'auto' }}
                      onClick={() => setMobileTab('list')}
                    >
                      <ArrowLeft size={13} /> {t('Back to Asset List', 'সম্পদ তালিকায় ফিরুন', lang)}
                    </button>
                  </div>

                  {/* 8-Stage Cradle-to-Grave Stepper */}
                  <AssetLifecycleStepper asset={selectedAsset} lang={lang} />

                  {/* Custodian Handover E-Sign Prompt Banner */}
                  {!selectedAsset.custodianAcknowledged && selectedAsset.lifecycleStage !== 'disposed' && (
                    <div
                      style={{
                        background: 'rgba(217, 119, 6, 0.1)',
                        border: '1.5px solid rgba(217, 119, 6, 0.4)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        marginBottom: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-800)' }}>
                        <strong>✍️ {t('Custody Acceptance Sign-Off Pending:', 'হস্তান্তর গ্রহণ স্বাক্ষর অপেক্ষমাণ:', lang)}</strong>{' '}
                        {t(
                          `Issued to ${selectedAsset.custodian}. Cryptographic acceptance required.`,
                          `${selectedAsset.custodian}-এর ডিজিটাল গ্রহণ স্বাক্ষর প্রয়োজন।`,
                          lang
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-gold"
                        style={{ padding: '5px 12px', fontSize: '11px', fontWeight: 800 }}
                        onClick={() => {
                          acknowledgeCustody(selectedAsset.id, currentPersona.name, currentPersona.label);
                          showToast(
                            t(
                              `✓ Custody receipt digitally signed for ${selectedAsset.tag}!`,
                              `✓ ${selectedAsset.tag}-এর হেফাজত গ্রহণ স্বাক্ষর সম্পন্ন!`,
                              lang
                            ),
                            'gold'
                          );
                        }}
                      >
                        <UserCheck size={13} style={{ display: 'inline', marginRight: '4px' }} />
                        {t('Sign Custody Receipt', 'গ্রহণ স্বাক্ষর করুন', lang)}
                      </button>
                    </div>
                  )}

                  {/* 4 Inspector Sub-Tabs */}
                  <div className="pill-tabs" style={{ marginBottom: '14px' }}>
                    <button
                      type="button"
                      className={`pill-tab ${inspectorTab === 'overview' ? 'active' : ''}`}
                      onClick={() => setInspectorTab('overview')}
                    >
                      <Eye size={13} /> {t('Specs & Controls', 'বিবরণ ও নিয়ন্ত্রণ', lang)}
                    </button>
                    <button
                      type="button"
                      className={`pill-tab ${inspectorTab === 'timeline' ? 'active' : ''}`}
                      onClick={() => setInspectorTab('timeline')}
                    >
                      <History size={13} /> {t('Lifetime Ledger', 'জীবনচক্র খতিয়ান', lang)} ({selectedAsset.lifecycleEvents.length})
                    </button>
                    <button
                      type="button"
                      className={`pill-tab ${inspectorTab === 'custody' ? 'active' : ''}`}
                      onClick={() => setInspectorTab('custody')}
                    >
                      <UserCheck size={13} /> {t('Custody Chain', 'হেফাজত ইতিহাস', lang)} ({selectedAsset.custodyHistory.length})
                    </button>
                    {!roleConfig.isSelfServiceOnly && (
                      <button
                        type="button"
                        className={`pill-tab ${inspectorTab === 'spares' ? 'active' : ''}`}
                        onClick={() => setInspectorTab('spares')}
                      >
                        <Package size={13} /> {t('BOM Spares', 'খুচরা যন্ত্রাংশ', lang)} ({selectedAsset.spares.length})
                      </button>
                    )}
                  </div>

                  {/* SUB-TAB A: OVERVIEW, SPECS & ROLE-GATED LIFECYCLE ACTIONS */}
                  {inspectorTab === 'overview' && (
                    <div>
                      <div style={{ background: 'var(--brand-slate-100)', padding: '11px 13px', borderRadius: '8px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                          {t('OEM & Technical Operating Specifications', 'প্রস্তুতকারক ও প্রযুক্তিগত বৈশিষ্ট্য', lang)}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '3px', color: 'var(--brand-slate-900)' }}>
                          {selectedAsset.oem} • Model: <code>{selectedAsset.modelNo}</code> • S/N: <code>{selectedAsset.serialNo}</code>
                        </div>
                        <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--brand-slate-600)', lineHeight: 1.45 }}>
                          {selectedAsset.specs}
                        </div>
                      </div>

                      <div className="responsive-col-2-eq" style={{ gap: '10px', marginBottom: '12px' }}>
                        <div style={{ padding: '9px 11px', border: '1px solid var(--brand-slate-200)', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>{t('Functional Location & GL', 'অবস্থান ও কস্ট সেন্টার', lang)}</div>
                          <div style={{ fontWeight: 700, fontSize: '12px' }}>{selectedAsset.functionalLocation}</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--brand-crimson)', fontFamily: 'monospace', fontWeight: 700 }}>
                            {selectedAsset.glCostCenter} • {selectedAsset.regulatoryAuthority}
                          </div>
                        </div>
                        <div style={{ padding: '9px 11px', border: '1px solid var(--brand-slate-200)', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>{t('Custodian & Commissioned', 'হেফাজতকারী ও কমিশনিং', lang)}</div>
                          <div style={{ fontWeight: 700, fontSize: '12px' }}>{selectedAsset.custodian}</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>
                            Comm: {selectedAsset.commissioningDate} ({selectedAsset.department})
                          </div>
                        </div>
                      </div>

                      {/* Financial Snapshot Box (Hidden for Employee Self-Service) */}
                      {roleConfig.canViewFinancialLedger && (
                        <div
                          style={{
                            padding: '10px 12px',
                            border: '1px solid var(--brand-slate-200)',
                            borderRadius: '8px',
                            marginBottom: '12px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '8px',
                            fontSize: '11px',
                          }}
                        >
                          <div>
                            <div style={{ color: 'var(--brand-slate-400)' }}>Gross CAPEX</div>
                            <strong style={{ fontSize: '12.5px' }}>৳{(selectedFinancials.grossCapitalizedCost / 100000).toFixed(2)}L</strong>
                          </div>
                          <div>
                            <div style={{ color: 'var(--brand-slate-400)' }}>Carrying NBV ({selectedAsset.depreciationMethod})</div>
                            <strong style={{ fontSize: '12.5px', color: '#059669' }}>৳{(selectedFinancials.netBookValue / 100000).toFixed(2)}L</strong>
                          </div>
                          <div>
                            <div style={{ color: 'var(--brand-slate-400)' }}>Lifetime TCO (OPEX {selectedFinancials.repairToCapexRatioPct}%)</div>
                            <strong style={{ fontSize: '12.5px', color: selectedFinancials.repairToCapexRatioPct >= 50 ? '#DC2626' : 'inherit' }}>
                              ৳{(selectedFinancials.totalCostOfOwnership / 100000).toFixed(2)}L
                            </strong>
                          </div>
                        </div>
                      )}

                      {/* Active Deficiency Alert */}
                      {selectedAsset.defectQuery && (
                        <div
                          style={{
                            background: 'rgba(220, 38, 38, 0.08)',
                            border: '1.5px solid rgba(220, 38, 38, 0.35)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            marginBottom: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#B91C1C', fontWeight: 800, fontSize: '12px' }}>
                            <AlertTriangle size={14} />
                            <span>{t('Active Maintenance / Calibration Deficiency', 'সক্রিয় ত্রুটি / ক্যালিব্রেশন আপত্তি', lang)}</span>
                          </div>
                          <div style={{ fontSize: '11.5px', marginTop: '4px' }}>
                            <strong>{selectedAsset.defectQuery.reason}:</strong> {selectedAsset.defectQuery.observation}
                          </div>
                          <div style={{ fontSize: '11px', color: '#059669', marginTop: '3px', fontWeight: 600 }}>
                            ➔ {selectedAsset.defectQuery.improvementsRequired}
                          </div>
                        </div>
                      )}

                      {/* Disposal Summary if Disposed */}
                      {selectedAsset.disposalDossier && selectedAsset.lifecycleStage === 'disposed' && (
                        <div
                          style={{
                            padding: '11px 13px',
                            background: 'var(--brand-slate-100)',
                            border: '1px solid var(--brand-slate-300)',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            marginBottom: '12px',
                          }}
                        >
                          <div style={{ fontWeight: 800, marginBottom: '4px' }}>
                            🏛️ {t('Stage-8 Retired & Archived Dossier', 'নিষ্পত্তিকৃত সংবিধিবদ্ধ আর্কাইভ রেকর্ড', lang)} ({selectedAsset.disposalDossier.sapRetirementVoucher})
                          </div>
                          <div>Method: <strong>{selectedAsset.disposalDossier.disposalMethod}</strong> • Buyer: <strong>{selectedAsset.disposalDossier.buyerOrVendor}</strong></div>
                          <div>
                            Proceeds: <strong>৳{selectedAsset.disposalDossier.salvageProceedsBdt?.toLocaleString()}</strong> • Gain/Loss:{' '}
                            <strong style={{ color: (selectedAsset.disposalDossier.gainOrLossBdt || 0) >= 0 ? '#059669' : '#DC2626' }}>
                              {(selectedAsset.disposalDossier.gainOrLossBdt || 0) >= 0
                                ? `+৳${selectedAsset.disposalDossier.gainOrLossBdt?.toLocaleString()}`
                                : `-৳${Math.abs(selectedAsset.disposalDossier.gainOrLossBdt || 0).toLocaleString()}`}
                            </strong>
                          </div>
                        </div>
                      )}

                      {/* Role-Gated Action Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '8px' }}>
                        {roleConfig.canCertifyCalibration &&
                          selectedAsset.lifecycleStage !== 'disposed' &&
                          selectedAsset.lifecycleStage !== 'decommissioned' && (
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ justifyContent: 'center' }}
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
                              <CheckCircle size={14} /> {t('Certify Calibration / PM', 'ক্যালিব্রেশন প্রত্যয়ন করুন', lang)}
                            </button>
                          )}

                        {roleConfig.canManageWorkOrders &&
                          selectedAsset.lifecycleStage !== 'disposed' &&
                          selectedAsset.lifecycleStage !== 'decommissioned' && (
                            <button
                              type="button"
                              className="btn-outline"
                              style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => setShowWorkOrderModal(true)}
                            >
                              <Wrench size={14} /> {t('Dispatch Work Order', 'কার্যাদেশ জারি করুন', lang)}
                            </button>
                          )}

                        {roleConfig.canTransferCustody &&
                          selectedAsset.lifecycleStage !== 'disposed' &&
                          selectedAsset.lifecycleStage !== 'decommissioned' && (
                            <button
                              type="button"
                              className="btn-outline"
                              style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => setShowTransferModal(true)}
                            >
                              <ArrowRightLeft size={14} /> {t('Assign / Transfer Custody', 'হস্তান্তর / স্থানান্তর', lang)}
                            </button>
                          )}

                        {roleConfig.canViewFinancialLedger && (
                          <button
                            type="button"
                            className="btn-outline"
                            style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => setScheduleTargetAsset(selectedAsset)}
                          >
                            <DollarSign size={14} /> {t('IAS 16 Depreciation Table', 'অবচয় তফসিল দেখুন', lang)}
                          </button>
                        )}

                        {selectedAsset.lifecycleStage !== 'disposed' &&
                          selectedAsset.lifecycleStage !== 'decommissioned' && (
                            <button
                              type="button"
                              className="btn-outline"
                              style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px', borderColor: '#DC2626', color: '#DC2626' }}
                              onClick={() => setShowRejectModal(true)}
                            >
                              <RotateCcw size={14} />
                              {roleConfig.isSelfServiceOnly
                                ? t('Report Hardware Defect', 'ত্রুটি বা মেরামতের রিপোর্ট', lang)
                                : t('Flag Deficiency / Fault', 'ক্যালিব্রেশন ত্রুটি ফ্ল্যাগ', lang)}
                            </button>
                          )}

                        <button
                          type="button"
                          className="btn-outline"
                          style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => setShowPassportModal(true)}
                        >
                          <Barcode size={14} /> {t('Digital QR Passport', 'মেটাল কিউআর পাসপোর্ট', lang)}
                        </button>

                        {roleConfig.canInitiateDecommission &&
                          selectedAsset.lifecycleStage !== 'decommissioned' &&
                          selectedAsset.lifecycleStage !== 'disposed' && (
                            <button
                              type="button"
                              className="btn-outline-danger"
                              style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => setShowDecommissionModal(true)}
                            >
                              <Archive size={14} /> {t('Condemn / Decommission', 'অকেজো / ডিকমিশন জরিপ', lang)}
                            </button>
                          )}

                        {roleConfig.canAuthorizeWriteOff && selectedAsset.lifecycleStage === 'decommissioned' && (
                          <button
                            type="button"
                            className="btn-gold"
                            style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
                            onClick={() => setDisposalTargetAsset(selectedAsset)}
                          >
                            👑 {t('Sanction Write-Off & Dispose', 'চূড়ান্ত অবলোপন ও নিলাম অনুমোদন', lang)}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB B: IMMUTABLE CRADLE-TO-GRAVE LIFETIME TIMELINE */}
                  {inspectorTab === 'timeline' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '390px', overflowY: 'auto', paddingRight: '4px' }}>
                      {selectedAsset.lifecycleEvents.map((ev) => (
                        <div
                          key={ev.id}
                          style={{
                            border: '1px solid var(--brand-slate-200)',
                            borderLeft: '3.5px solid var(--brand-crimson)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            background: 'var(--brand-card-bg)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--brand-slate-900)' }}>{ev.title}</div>
                            <span style={{ fontSize: '10px', color: 'var(--brand-slate-400)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={10} /> {ev.timestamp}
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-600)', marginTop: '4px', lineHeight: 1.4 }}>
                            {ev.notes}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--brand-slate-200)', fontSize: '10px', color: 'var(--brand-slate-500)' }}>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                        {selectedAsset.custodyHistory.map((ch, idx) => {
                          const isCurrent = !ch.returnedDate;
                          return (
                            <div
                              key={ch.id}
                              style={{
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: isCurrent ? '1.5px solid #059669' : '1px solid var(--brand-slate-200)',
                                background: isCurrent ? 'rgba(5, 150, 105, 0.05)' : 'var(--brand-card-bg)',
                                fontSize: '11.5px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                <strong>
                                  #{idx + 1} · {ch.custodianName} {ch.custodianEmpId ? `(${ch.custodianEmpId})` : ''}
                                </strong>
                                <span className={`badge ${isCurrent ? 'success' : 'info'}`}>
                                  {isCurrent ? t('Current Holder', 'বর্তমান হেফাজতকারী', lang) : `Returned: ${ch.returnedDate}`}
                                </span>
                              </div>
                              <div style={{ color: 'var(--brand-slate-500)', marginTop: '3px' }}>
                                📍 {ch.facility} — {ch.functionalLocation} ({ch.department})
                              </div>
                              <div style={{ fontSize: '11px', marginTop: '4px' }}>
                                Assigned: <strong>{ch.assignedDate}</strong> •{' '}
                                {ch.acknowledged ? (
                                  <span style={{ color: '#059669', fontWeight: 700 }}>✓ E-Signed {ch.acknowledgedAt ? `(${ch.acknowledgedAt})` : ''}</span>
                                ) : (
                                  <span style={{ color: '#D97706', fontWeight: 700 }}>⏳ Signature Pending</span>
                                )}
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)', marginTop: '2px' }}>
                                Handover Note: {ch.conditionOnHandover}
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
                        <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--brand-slate-400)' }}>
                          {t('No dedicated BOM sub-assembly spares registered for this unit (sealed/IT equipment).', 'এই সরঞ্জামের জন্য আলাদা কোনো খুচরা যন্ত্রাংশ বিওএম তালিকাভুক্ত নেই।', lang)}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {selectedAsset.spares.map((sp) => {
                            const isLow = sp.stockQty <= sp.minReorderQty;
                            return (
                              <div
                                key={sp.id}
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid var(--brand-slate-200)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '8px',
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '12px' }}>{sp.name}</div>
                                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', fontFamily: 'monospace' }}>
                                    Part: {sp.partNo} • Unit Cost: ৳{sp.unitCostBdt.toLocaleString()} • Lead: {sp.leadTimeDays}d
                                  </div>
                                  <div style={{ marginTop: '4px' }}>
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
                                      style={{ fontSize: '11px', padding: '5px 10px' }}
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
                                      style={{ fontSize: '11px', padding: '5px 10px' }}
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
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: PREVENTIVE, CORRECTIVE & STATUTORY CALIBRATION WORK ORDERS
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'maintenance' && (
        <div className="card">
          <div className="card-hd" style={{ flexWrap: 'wrap', gap: '10px' }}>
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
              <div className="pill-tabs" style={{ width: 'auto' }}>
                <button className={`pill-tab ${woFilter === 'all' ? 'active' : ''}`} onClick={() => setWoFilter('all')}>
                  {t('All', 'সকল', lang)} ({visibleWorkOrders.length})
                </button>
                <button className={`pill-tab ${woFilter === 'open' ? 'active' : ''}`} onClick={() => setWoFilter('open')}>
                  {t('Open / Due', 'চলমান', lang)}
                </button>
                <button className={`pill-tab ${woFilter === 'completed' ? 'active' : ''}`} onClick={() => setWoFilter('completed')}>
                  {t('Certified', 'প্রত্যয়িত', lang)}
                </button>
              </div>

              {roleConfig.canManageWorkOrders && (
                <button className="btn-primary" onClick={() => setShowWorkOrderModal(true)}>
                  <Plus size={14} /> {t('New Work Order', 'নতুন কার্যাদেশ', lang)}
                </button>
              )}
            </div>
          </div>

          <div className="card-body">
            {visibleWorkOrders.length === 0 ? (
              <div style={{ padding: '28px', textAlign: 'center', color: 'var(--brand-slate-400)' }}>
                {t('No maintenance or calibration work orders recorded in this scope.', 'কোনো রক্ষণাবেক্ষণ কার্যাদেশ নেই।', lang)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {visibleWorkOrders.map((wo) => (
                  <div
                    key={wo.id}
                    style={{
                      border: '1px solid var(--brand-slate-200)',
                      borderLeft: `4px solid ${
                        wo.status === 'completed'
                          ? '#059669'
                          : wo.priority === 'critical'
                          ? '#DC2626'
                          : '#D97706'
                      }`,
                      borderRadius: '8px',
                      padding: '12px 16px',
                      background: 'var(--brand-card-bg)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ flex: '1 1 360px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-crimson)', fontSize: '12px' }}>
                          {wo.woNumber}
                        </span>
                        <span className={`badge ${wo.type === 'CAL' ? 'danger' : wo.type === 'CM' ? 'warn' : 'info'}`}>
                          {wo.type}
                        </span>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, fontFamily: 'monospace' }}>🏷️ {wo.assetTag}</span>
                        {wo.lotoPermitRef && (
                          <span className="badge danger" style={{ fontSize: '10px' }}>🔒 {wo.lotoPermitRef}</span>
                        )}
                        {wo.coveredByWarranty && (
                          <span className="badge success" style={{ fontSize: '10px' }}>🛡️ OEM Warranty (৳0)</span>
                        )}
                        {wo.isCapexOverhaul && (
                          <span className="badge gold" style={{ fontSize: '10px' }}>IAS 16 Capitalized Overhaul</span>
                        )}
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--brand-slate-900)' }}>{wo.title}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                        Asset: <strong>{wo.assetName}</strong> • Assigned: <strong>{wo.assignedEngineer}</strong>
                        {wo.regulatoryBody ? ` • Authority: ${wo.regulatoryBody}` : ''}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', marginTop: '3px' }}>
                        {wo.remarks}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <div>
                        <strong style={{ fontSize: '13.5px' }}>
                          {wo.coveredByWarranty ? '৳0 (Warranty)' : `৳${wo.estimatedCostBdt.toLocaleString()}`}
                        </strong>
                        <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>
                          {wo.status === 'completed' ? `Certified: ${wo.completedDate}` : `Due: ${wo.dueDate}`}
                        </div>
                      </div>

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
                          <CheckCircle size={13} /> {t('Certify & Complete', 'প্রত্যয়ন ও সম্পন্ন করুন', lang)}
                        </button>
                      ) : (
                        <span className="badge warn">{t('In Progress (Engineering)', 'প্রক্রিয়াধীন', lang)}</span>
                      )}
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
                    'Supports Straight-Line (SLM), Declining Balance (WDV) & Units-of-Production (UoP) with automated 50% Repair-to-CAPEX EoL threshold',
                    'সরলরৈখিক (SLM), ক্রমহ্রাসমান (WDV) ও উৎপাদন-ঘণ্টা (UoP) অবচয় পদ্ধতি এবং ৫০% মেরামত-সীমা সতর্কতা',
                    lang
                  )}
                </div>
              </div>
            </div>

            <button className="btn-primary" onClick={handleExportMasterLedgerCsv}>
              <Download size={14} /> {t('Export SAP FI-AA Ledger (CSV)', 'খতিয়ান ডাউনলোড (CSV)', lang)}
            </button>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('Asset Tag & SAP FI-AA', 'ট্যাগ ও এসএপি কোড', lang)}</th>
                    <th>{t('GL Cost Center', 'কস্ট সেন্টার', lang)}</th>
                    <th>{t('Gross CAPEX', 'মোট মূলধন ব্যয়', lang)}</th>
                    <th>{t('Method & Annual Dep.', 'পদ্ধতি ও বার্ষিক অবচয়', lang)}</th>
                    <th>{t('Accumulated Dep.', 'পুঞ্জীভূত অবচয়', lang)}</th>
                    <th>{t('Carrying NBV', 'বর্তমান বইমূল্য (NBV)', lang)}</th>
                    <th>{t('Lifetime TCO & Repair %', 'মোট ব্যয় (TCO) ও মেরামত %', lang)}</th>
                    <th style={{ textAlign: 'right' }}>{t('Schedule', 'তফসিল', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {roleScopedAssets.map((a) => {
                    const f = calculateAssetFinancials(a);
                    return (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '12.5px' }}>{a.name}</div>
                          <div style={{ fontSize: '10.5px', fontFamily: 'monospace', color: 'var(--brand-crimson)', fontWeight: 700 }}>
                            {a.tag} • {a.sapAssetNo}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: '11.5px', fontWeight: 700 }}>{a.glCostCenter}</span>
                          <div style={{ fontSize: '10px', color: 'var(--brand-slate-400)' }}>Life: {a.usefulLifeYears} yrs</div>
                        </td>
                        <td style={{ fontWeight: 700 }}>৳{f.grossCapitalizedCost.toLocaleString()}</td>
                        <td>
                          <span className="badge info" style={{ fontSize: '10px' }}>{a.depreciationMethod}</span>
                          <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '2px' }}>
                            -৳{f.annualDepreciation.toLocaleString()}/yr
                          </div>
                        </td>
                        <td>৳{f.accumulatedDepreciation.toLocaleString()}</td>
                        <td style={{ fontWeight: 800, color: a.lifecycleStage === 'disposed' ? 'var(--brand-slate-400)' : '#059669' }}>
                          {a.lifecycleStage === 'disposed' ? '৳0 (Retired)' : `৳${f.netBookValue.toLocaleString()}`}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>৳{f.totalCostOfOwnership.toLocaleString()}</div>
                          <div
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              color: f.repairToCapexRatioPct >= 50 ? '#DC2626' : f.repairToCapexRatioPct >= 30 ? '#D97706' : '#059669',
                            }}
                          >
                            OPEX Ratio: {f.repairToCapexRatioPct}% {f.repairToCapexRatioPct >= 50 ? '⚠️ EoL' : ''}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn-outline"
                            style={{ fontSize: '11px', padding: '5px 10px' }}
                            onClick={() => setScheduleTargetAsset(a)}
                          >
                            {t('View Table', 'তফসিল', lang)}
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
                    {t('End-to-end birth tracking: Requisition → HOD/GM Vetting → CFO/Chairman Sanction → Auto-Tag Commissioning', 'আবেদন হতে বিভাগীয় সুপারিশ, চেয়ারম্যান/অর্থ অনুমোদন এবং স্বয়ংক্রিয় অ্যাসেট ট্যাগ কমিশনিং', lang)}
                  </div>
                </div>
              </div>
              <button className="btn-primary" onClick={() => setShowRequisitionModal(true)}>
                <Plus size={14} /> {t('New Asset Requisition', 'নতুন রিকুইজিশন দাখিল', lang)}
              </button>
            </div>

            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {visibleRequisitions.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      border: '1px solid var(--brand-slate-200)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      background: 'var(--brand-card-bg)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ flex: '1 1 360px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-crimson)', fontSize: '12px' }}>
                          {req.reqNumber}
                        </span>
                        <span className={`badge ${req.urgency === 'critical' ? 'danger' : req.urgency === 'high' ? 'warn' : 'info'}`}>
                          {req.urgency.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--brand-gold-dark)' }}>
                          Est. CAPEX: ৳{req.estimatedCapexBdt.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--brand-slate-900)' }}>{req.title}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                        Requester: <strong>{req.requestedBy}</strong> ({req.department}) • Site: <strong>{req.facility}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', marginTop: '3px' }}>
                        Justification: {req.justification}
                      </div>
                      {(req.endorsedByHod || req.sanctionedByExec) && (
                        <div style={{ fontSize: '10.5px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
                          {req.endorsedByHod ? `✓ Vetted: ${req.endorsedByHod}` : ''}{' '}
                          {req.sanctionedByExec ? ` • ✓ Sanctioned: ${req.sanctionedByExec}` : ''}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      {req.stage === 'commissioned' ? (
                        <span className="badge success" style={{ fontSize: '11px' }}>
                          ✓ Commissioned as {req.mintedAssetTag}
                        </span>
                      ) : (
                        <>
                          <span className="badge info">
                            {req.stage === 'pending_hod'
                              ? 'Step 1/3: Pending HOD/GM Vetting'
                              : req.stage === 'pending_executive'
                              ? 'Step 2/3: Pending CFO / Chairman Sanction'
                              : 'Step 3/3: Approved — Ready for GRN & Tagging'}
                          </span>

                          {roleConfig.canApproveRequisition && (
                            <button
                              type="button"
                              className={req.stage === 'pending_executive' ? 'btn-gold' : 'btn-primary'}
                              style={{ padding: '6px 12px', fontSize: '11.5px', fontWeight: 800 }}
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
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
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
                    <div className="card-subtitle">{t('Auditable 3-step physical & custodial movement history across facilities', 'কারখানা, সদর দপ্তর ও টার্মিনালের মধ্যে সম্পদ স্থানান্তরের পূর্ণ ইতিহাস', lang)}</div>
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {transfers.map((trf) => (
                    <div
                      key={trf.id}
                      style={{
                        border: '1px solid var(--brand-slate-200)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-crimson)', fontSize: '12px' }}>
                            {trf.transferRef}
                          </span>
                          <span className="badge info" style={{ fontFamily: 'monospace' }}>Gate Pass: {trf.gatePassNo}</span>
                          <strong style={{ fontSize: '12.5px' }}>{trf.assetTag} — {trf.assetName}</strong>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-600)', marginTop: '4px' }}>
                          <strong>From:</strong> {trf.fromCustodian} ({trf.fromFacility}) ➔ <strong>To:</strong> {trf.toCustodian} ({trf.toFacility} · {trf.toLocation})
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', marginTop: '2px' }}>
                          Reason: {trf.reason} • Initiated: {trf.initiatedAt}
                        </div>
                      </div>

                      <div>
                        {trf.status === 'completed' ? (
                          <span className="badge success">✓ Handover Completed ({trf.completedAt})</span>
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
                            <CheckCircle size={13} /> {t('Confirm Arrival & Receive Custody', 'প্রাপ্তি নিশ্চিত ও হস্তান্তর সম্পন্ন', lang)}
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
                      'Mandatory 4-Point Pre-Disposal Checklist (Engineering Survey · DoE Gas-Free / NIST Data Wipe · Spares Harvest · CFO/Chairman Sanction)',
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
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--brand-slate-400)', fontSize: '12.5px' }}>
                  ✓ {t('No condemned assets currently awaiting write-off authorization.', 'বর্তমানে কোনো অকেজো সম্পদ অবলোপনের অপেক্ষায় নেই।', lang)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {decommissionedAssets.map((a) => {
                    const fin = calculateAssetFinancials(a);
                    const cl = a.disposalDossier?.checklist;
                    const allChecked =
                      cl?.technicalSurveySigned &&
                      cl?.decontaminationOrDataWipeCertified &&
                      cl?.sparesHarvested &&
                      cl?.financeCfoVetted;

                    return (
                      <div
                        key={a.id}
                        style={{
                          border: '1.5px solid rgba(220, 38, 38, 0.35)',
                          borderRadius: '10px',
                          padding: '14px 16px',
                          background: 'var(--brand-card-bg)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-crimson)', fontSize: '12.5px' }}>
                                🏷️ {a.tag} ({a.sapAssetNo})
                              </span>
                              <span className="badge danger">{a.disposalDossier?.reason}</span>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '14px', marginTop: '3px', color: 'var(--brand-slate-900)' }}>{a.name}</div>
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

                        {/* Interactive 4-Point Checklist */}
                        {cl && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                            {(
                              [
                                ['technicalSurveySigned', '1. Engineering Condemnation Survey'],
                                ['decontaminationOrDataWipeCertified', '2. DoE Gas-Free / NIST 800-88 Wipe'],
                                ['sparesHarvested', '3. Reusable BOM Spares Harvested'],
                                ['financeCfoVetted', '4. CFO Fixed-Asset Ledger Audit'],
                              ] as const
                            ).map(([key, label]) => {
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
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--brand-slate-200)',
                                    background: checked ? 'rgba(5, 150, 105, 0.09)' : 'var(--brand-slate-100)',
                                    color: checked ? '#059669' : 'var(--brand-slate-600)',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                  }}
                                >
                                  {checked ? <CheckSquare size={15} /> : <Square size={15} />}
                                  <span>{label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                            🔒 Segregation of Duties: Final balance-sheet write-off requires <strong>Chairman & MD</strong> or <strong>CFO / Head of Finance</strong> sanction.
                          </span>

                          {roleConfig.canAuthorizeWriteOff ? (
                            <button
                              type="button"
                              className="btn-gold"
                              style={{ fontWeight: 800 }}
                              onClick={() => {
                                if (!allChecked) {
                                  showToast(t('Please verify all 4 mandatory pre-disposal safety & audit checks first.', 'অনুগ্রহ করে প্রথমে ৪টি প্রাক-অবলোপন চেকলিস্ট নিশ্চিত করুন।', lang), 'warn');
                                  return;
                                }
                                setDisposalTargetAsset(a);
                              }}
                            >
                              👑 {t('Authorize Write-Off & Execute Disposal', 'চূড়ান্ত অবলোপন ও নিলাম নিষ্পত্তি করুন', lang)}
                            </button>
                          ) : (
                            <span className="badge warn">Awaiting CFO / Chairman Write-Off Sanction</span>
                          )}
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
                    </tr>
                  </thead>
                  <tbody>
                    {disposedAssets.map((a) => {
                      const d = a.disposalDossier;
                      const gl = d?.gainOrLossBdt || 0;
                      return (
                        <tr key={a.id}>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '12.5px' }}>{a.name}</div>
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
          setSelectedAssetId(a.id);
          setActiveTab('register');
          setMobileTab('detail');
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
