import React, { useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
import {
  Wrench, ShieldCheck, AlertTriangle, Calendar, Search, Filter,
  Download, Plus, RefreshCw, Barcode, CheckCircle, Clock,
  Cpu, Truck, Gauge, Shield, ChevronRight, Layers, DollarSign,
  X, QrCode, Printer, RotateCcw
} from 'lucide-react';
import RejectionExplanationModal, { RejectionData } from '../components/RejectionExplanationModal';

interface AssetRecord {
  id: string;
  tag: string;
  name: string;
  category: 'plant' | 'vehicle' | 'it' | 'safety';
  location: string;
  custodian: string;
  procurementDate: string;
  purchaseCost: number;
  currentBookValue: number;
  status: 'operational' | 'maintenance' | 'calibration_due' | 'decommissioned';
  nextServiceDate: string;
  daysToService: number;
  serialNo: string;
  specs: string;
  defectQuery?: {
    reason: string;
    observation: string;
    improvementsRequired: string;
    reportedBy: string;
    reportedAt: string;
  };
}

const INITIAL_ASSETS: AssetRecord[] = [
  {
    id: 'AST-001',
    tag: 'BOGCL-KER-PMP-102',
    name: 'Sulzer Multiphase Crude Oil Feed Pump',
    category: 'plant',
    location: 'Keraniganj Refinery — Unit 1',
    custodian: 'Engr. Harunur Rashid',
    procurementDate: '12 Jan 2022',
    purchaseCost: 8500000,
    currentBookValue: 5950000,
    status: 'operational',
    nextServiceDate: '15 Nov 2026',
    daysToService: 28,
    serialNo: 'SLZ-MPP-99214-DE',
    specs: 'Flow: 350 m³/h, Pressure: 42 Bar, Motor: 180kW ABB Explosion-Proof',
  },
  {
    id: 'AST-002',
    tag: 'BOGCL-KER-DST-C102',
    name: 'Atmospheric Bitumen Distillation Tower C-102',
    category: 'plant',
    location: 'Keraniganj Refinery — Column Farm',
    custodian: 'Engr. Tariq Ahmed',
    procurementDate: '18 Nov 2020',
    purchaseCost: 65000000,
    currentBookValue: 48750000,
    status: 'calibration_due',
    nextServiceDate: '28 Oct 2026',
    daysToService: 11,
    serialNo: 'BOGCL-FAB-2020-09',
    specs: 'Height: 38m, Dia: 3.2m, Operating Temp: 380°C, ASME Sec VIII Div 1',
  },
  {
    id: 'AST-003',
    tag: 'BOGCL-FLT-TNK-08',
    name: 'Scania R500 Specialized Bitumen Tanker (30,000L)',
    category: 'vehicle',
    location: 'Central Transport Pool — Tejgaon',
    custodian: 'Md. Kamruzzaman',
    procurementDate: '05 Mar 2023',
    purchaseCost: 12500000,
    currentBookValue: 9800000,
    status: 'operational',
    nextServiceDate: '10 Dec 2026',
    daysToService: 53,
    serialNo: 'YS2R6X200021948',
    specs: 'Insulated Heating Jacket, Double Compartment, GPS Telematics enabled',
  },
  {
    id: 'AST-004',
    tag: 'BOGCL-IT-SRV-04',
    name: 'HPE ProLiant DL380 Gen10 SCADA DCS Master Server',
    category: 'it',
    location: 'Refinery Control Room Server Suite',
    custodian: 'Kazi Moinul Islam',
    procurementDate: '10 Aug 2023',
    purchaseCost: 1850000,
    currentBookValue: 1295000,
    status: 'operational',
    nextServiceDate: '01 Feb 2027',
    daysToService: 105,
    serialNo: 'HPE-CZJ240187B',
    specs: 'Dual Xeon Gold 6330, 256GB RAM, RAID 10 NVMe, Dual Redundant PSU',
  },
  {
    id: 'AST-005',
    tag: 'BOGCL-SFT-DET-18',
    name: 'Honeywell Multi-Gas Flame & Toxic H2S Detector Array',
    category: 'safety',
    location: 'Sulfur Recovery Unit (SRU)',
    custodian: 'Engr. Harunur Rashid',
    procurementDate: '14 Feb 2024',
    purchaseCost: 950000,
    currentBookValue: 810000,
    status: 'maintenance',
    nextServiceDate: '22 Oct 2026',
    daysToService: 5,
    serialNo: 'HW-FGD-88102-BD',
    specs: 'Zone 0 ATEX Certified, 4-20mA HART loop, Wireless beacon integration',
  },
];

export default function AssetView({ role, lang }: ViewProps) {
  const [assets, setAssets] = useState<AssetRecord[]>(INITIAL_ASSETS);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'plant' | 'vehicle' | 'it' | 'safety'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<AssetRecord | null>(INITIAL_ASSETS[0]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // New Asset Form State
  const [newTag, setNewTag] = useState('BOGCL-KER-PMP-105');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'plant' | 'vehicle' | 'it' | 'safety'>('plant');
  const [newLocation, setNewLocation] = useState('Keraniganj Refinery — Column Farm Unit 2');
  const [newCustodian, setNewCustodian] = useState('Engr. Md. Harunur Rashid');
  const [newCost, setNewCost] = useState('4500000');
  const [newSpecs, setNewSpecs] = useState('High-Pressure Bitumen Circulation Booster Pump (24 Bar, Explosion-Proof)');
  const [newSerial, setNewSerial] = useState('SLZ-BPP-2026-BD');
  const [newDaysToService, setNewDaysToService] = useState('90');

  const handleRegisterAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast(lang === 'en' ? 'Please specify asset equipment name.' : 'অনুগ্রহ করে সম্পদের নাম উল্লেখ করুন।', 'warn');
      return;
    }
    const costNum = Number(newCost) || 1000000;
    const newRecord: AssetRecord = {
      id: `AST-${String(assets.length + 1).padStart(3, '0')}`,
      tag: newTag.trim() || `BOGCL-EQ-${Date.now().toString().slice(-4)}`,
      name: newName.trim(),
      category: newCategory,
      location: newLocation,
      custodian: newCustodian,
      procurementDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      purchaseCost: costNum,
      currentBookValue: costNum,
      status: 'operational',
      nextServiceDate: '28 Apr 2027',
      daysToService: Number(newDaysToService) || 90,
      serialNo: newSerial.trim() || `SN-${Date.now().toString().slice(-6)}`,
      specs: newSpecs.trim() || 'Industrial heavy machinery specification certified for refinery operations',
    };

    setAssets(prev => [newRecord, ...prev]);
    setSelectedAsset(newRecord);
    setShowRegisterModal(false);
    // Reset form
    setNewName('');
    showToast(
      lang === 'en'
        ? `✓ Asset Tag ${newRecord.tag} registered in ERP database with QR barcode passport.`
        : `✓ সম্পদ ট্যাগ ${newRecord.tag} সফলভাবে ডেটাবেজে নিবন্ধিত হয়েছে।`,
      'success'
    );
  };

  const filteredAssets = assets.filter(a => {
    const matchesCat = categoryFilter === 'all' || a.category === categoryFilter;
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalValue = assets.reduce((sum, a) => sum + a.currentBookValue, 0);

  const handleLogService = (id: string) => {
    setAssets(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: 'operational',
          nextServiceDate: '17 Apr 2027',
          daysToService: 180,
          defectQuery: undefined,
        };
      }
      return a;
    }));
    if (selectedAsset?.id === id) {
      setSelectedAsset(prev => prev ? { ...prev, status: 'operational', daysToService: 180, defectQuery: undefined } : null);
    }
    showToast(
      lang === 'en'
        ? `Preventive maintenance & calibration certified for ${id}. Next audit scheduled in 180 days.`
        : `${id}-এর রক্ষণাবেক্ষণ ও ক্যালিব্রেশন সফলভাবে লিপিবদ্ধ হয়েছে।`,
      'success'
    );
  };

  const handleConfirmAssetReject = (data: RejectionData) => {
    if (!selectedAsset) return;
    const updatedAsset: AssetRecord = {
      ...selectedAsset,
      status: 'maintenance',
      defectQuery: {
        reason: data.reasonCategory,
        observation: data.observation,
        improvementsRequired: data.improvementsRequired,
        reportedBy: role === 'plant_gm' ? 'Engr. Md. Harunur Rashid (Plant GM)' : 'Technical Audit Team',
        reportedAt: 'Today, Just Now',
      },
    };
    setAssets((prev) => prev.map((a) => (a.id === selectedAsset.id ? updatedAsset : a)));
    setSelectedAsset(updatedAsset);
    setShowRejectModal(false);
    showToast(
      t(
        `Calibration deficiency flagged on ${selectedAsset.tag}: "${data.reasonCategory}". Maintenance team notified.`,
        `${selectedAsset.tag}-এ ক্যালিব্রেশন ত্রুটি ও নির্দেশনা রেকর্ড করা হয়েছে।`,
        lang
      ),
      'warn'
    );
  };

  const getStatusBadge = (status: AssetRecord['status']) => {
    switch (status) {
      case 'operational':
        return <span className="badge success">Operational</span>;
      case 'calibration_due':
        return <span className="badge danger">Calibration Due (&lt;15d)</span>;
      case 'maintenance':
        return <span className="badge warn">Under Overhaul</span>;
      case 'decommissioned':
        return <span className="badge danger">Decommissioned</span>;
    }
  };

  return (
    <div className="view-container">
      {/* Section Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            🏗️ {t('Asset Lifecycle & Plant Reliability Management', 'সম্পদ জীবনচক্র ও প্ল্যান্ট রক্ষণাবেক্ষণ ব্যবস্থাপনা', lang)}
          </h2>
          <p className="section-subtitle">
            {t(
              'Enterprise tracking of refinery machinery, heavy transport fleet, SCADA infrastructure & mandatory calibration protocols.',
              'রিফাইনারি যন্ত্রপাতি, ভারী যানবাহন বহর, স্কাডা অবকাঠামো এবং বাধ্যতামূলক ক্যালিব্রেশন প্রটোকল মনিটরিং।',
              lang
            )}
          </p>
        </div>
        <div className="btn-group">
          <button
            className="btn-primary"
            onClick={() => setShowRegisterModal(true)}
          >
            <Plus size={15} /> {t('Register Asset Tag', 'নতুন সম্পদ নিবন্ধন', lang)}
          </button>
          <button
            className="btn-outline"
            onClick={() => setShowScanModal(true)}
          >
            <Barcode size={15} /> {t('Scan Asset Tag', 'ট্যাগ স্ক্যান', lang)}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid mb-5">
        <div className="kpi-card">
          <div className="kpi-label">{t('Total Asset Book Value', 'মোট সম্পদের বর্তমান মূল্য', lang)}</div>
          <div className="kpi-value text-crimson">৳{(totalValue / 10000000).toFixed(2)} Cr</div>
          <div className="kpi-sub">Across 5 capital classifications</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('Active Plant Units', 'সক্রিয় প্ল্যান্ট ইউনিট', lang)}</div>
          <div className="kpi-value text-emerald">98.4%</div>
          <div className="kpi-sub">High operational uptime at Keraniganj</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('Calibration / Audit Alerts', 'ক্যালিব্রেশন ও অডিট সতর্কতা', lang)}</div>
          <div className="kpi-value text-amber">
            {assets.filter(a => a.daysToService < 30).length} Assets
          </div>
          <div className="kpi-sub">Due within 30 days window</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('Depreciation Schedule', 'অবচয় সময়সূচি', lang)}</div>
          <div className="kpi-value text-blue">Straight Line 10%</div>
          <div className="kpi-sub">Audited as per BAS/IAS 16 Property & Plant</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
        <div className="pill-tabs">
          <button className={`pill-tab ${categoryFilter === 'all' ? 'active' : ''}`} onClick={() => setCategoryFilter('all')}>
            {t('All Assets', 'সকল সম্পদ', lang)} ({assets.length})
          </button>
          <button className={`pill-tab ${categoryFilter === 'plant' ? 'active' : ''}`} onClick={() => setCategoryFilter('plant')}>
            ⚙️ {t('Refinery Plant & Columns', 'রিফাইনারি ও কলাম', lang)}
          </button>
          <button className={`pill-tab ${categoryFilter === 'vehicle' ? 'active' : ''}`} onClick={() => setCategoryFilter('vehicle')}>
            🚛 {t('Fleet & Tankers', 'ফ্লিট ও ট্যাংকার', lang)}
          </button>
          <button className={`pill-tab ${categoryFilter === 'it' ? 'active' : ''}`} onClick={() => setCategoryFilter('it')}>
            💻 {t('SCADA / IT Systems', 'স্কাডা ও আইটি', lang)}
          </button>
          <button className={`pill-tab ${categoryFilter === 'safety' ? 'active' : ''}`} onClick={() => setCategoryFilter('safety')}>
            🛡️ {t('Safety & Detection', 'নিরাপত্তা সরঞ্জাম', lang)}
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--brand-slate-400)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '32px', fontSize: '13px' }}
            placeholder={t('Search by tag, name, serial...', 'ট্যাগ, নাম বা সিরিয়াল খুঁজুন...', lang)}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Grid: Asset Register Table + Inspector */}
      <div className="responsive-col-2">
        {/* Asset Table */}
        <div className="card">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><Wrench size={16} /></div>
              <div>
                <div className="card-title">{t('Capital Equipment Register', 'মূলধনী সরঞ্জাম তালিকা', lang)}</div>
                <div className="card-subtitle">{t('Real-time maintenance timeline & calibration validity', 'রক্ষণাবেক্ষণ সময়সূচি ও ক্যালিব্রেশন ট্র্যাকিং', lang)}</div>
              </div>
            </div>
            <button
              className="btn-sm-ghost"
              onClick={() => showToast(t('Synchronized with Plant ERP & IoT Sensors', 'প্ল্যান্ট ইআরপি এবং আইওটি সেন্সরের সাথে সিঙ্ক সম্পন্ন', lang), 'info')}
            >
              <RefreshCw size={14} /> {t('Sync IoT', 'আইওটি সিঙ্ক', lang)}
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('Tag / Name', 'ট্যাগ ও নাম', lang)}</th>
                    <th>{t('Location & Custodian', 'স্থান ও দায়িত্বপ্রাপ্ত', lang)}</th>
                    <th>{t('Valuation', 'বর্তমান মূল্য', lang)}</th>
                    <th>{t('Service Due', 'সার্ভিস বাকি', lang)}</th>
                    <th>{t('Status', 'অবস্থা', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map(item => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedAsset(item)}
                      style={{
                        cursor: 'pointer',
                        background: selectedAsset?.id === item.id ? 'var(--brand-gold-glow, rgba(165,28,48,0.06))' : undefined,
                      }}
                    >
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--brand-crimson)', fontWeight: 600 }}>
                          🏷️ {item.tag}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px' }}>{item.location}</div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{item.custodian}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>৳{(item.currentBookValue / 100000).toFixed(1)}L</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>Orig: ৳{(item.purchaseCost / 100000).toFixed(1)}L</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: item.daysToService <= 15 ? 'var(--brand-crimson)' : 'inherit' }}>
                          {item.daysToService} days
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>{item.nextServiceDate}</div>
                      </td>
                      <td>{getStatusBadge(item.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Selected Asset Details / Calibration Card */}
        {selectedAsset && (
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-hd-icon"><Barcode size={16} /></div>
                <div>
                  <div className="card-title">{selectedAsset.tag}</div>
                  <div className="card-subtitle">{selectedAsset.name}</div>
                </div>
              </div>
              {getStatusBadge(selectedAsset.status)}
            </div>
            <div className="card-body">
              <div style={{ background: 'var(--brand-slate-50)', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>
                  {t('Technical Specifications', 'প্রযুক্তিগত বৈশিষ্ট্য', lang)}
                </div>
                <div style={{ fontSize: '12.5px', marginTop: '4px', fontWeight: 500, lineHeight: '1.4' }}>
                  {selectedAsset.specs}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '6px' }}>
                  Serial No: <code>{selectedAsset.serialNo}</code>
                </div>
              </div>

              <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', border: '1px solid var(--brand-border)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{t('Procurement Date', 'ক্রয় তারিখ', lang)}</div>
                  <div style={{ fontWeight: 600, fontSize: '12.5px' }}>{selectedAsset.procurementDate}</div>
                </div>
                <div style={{ padding: '10px', border: '1px solid var(--brand-border)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{t('Custodian in Charge', 'দায়িত্বপ্রাপ্ত কর্মকর্তা', lang)}</div>
                  <div style={{ fontWeight: 600, fontSize: '12.5px' }}>{selectedAsset.custodian}</div>
                </div>
              </div>

              <div style={{ padding: '12px', background: 'var(--brand-card-bg)', border: '1px solid var(--brand-border)', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--brand-slate-500)' }}>{t('Next Preventive Maintenance', 'পরবর্তী প্রিভেন্টিভ মেইনটেন্যান্স', lang)}:</span>
                  <strong style={{ fontSize: '12px', color: selectedAsset.daysToService <= 15 ? 'var(--brand-crimson)' : 'inherit' }}>
                    {selectedAsset.nextServiceDate} ({selectedAsset.daysToService}d)
                  </strong>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--brand-slate-200)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.max(10, 100 - (selectedAsset.daysToService / 180) * 100)}%`,
                      height: '100%',
                      background: selectedAsset.daysToService <= 15 ? 'var(--brand-crimson)' : 'var(--brand-emerald-500)',
                    }}
                  />
                </div>
              </div>

              {/* Active Calibration / Service Deficiency Alert */}
              {selectedAsset.defectQuery && (
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1.5px solid #FCA5A5',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#991B1B', fontWeight: 800, fontSize: '12.5px' }}>
                    <AlertTriangle size={15} />
                    <span>{t('Active Maintenance / Calibration Deficiency', 'ক্যালিব্রেশন ত্রুটি বা আপত্তি সক্রিয়', lang)}</span>
                    <span style={{ fontSize: '10.5px', color: '#B91C1C', marginLeft: 'auto', fontWeight: 500 }}>
                      {selectedAsset.defectQuery.reportedBy} • {selectedAsset.defectQuery.reportedAt}
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#7F1D1D', marginTop: '6px' }}>
                    <strong>{t('Objection:', 'প্রধান কারণ:', lang)}</strong> {selectedAsset.defectQuery.reason}
                  </div>
                  <div style={{ fontSize: '11px', color: '#991B1B', marginTop: '3px' }}>
                    <strong>{t('Observation:', 'পর্যবেক্ষণ:', lang)}</strong> {selectedAsset.defectQuery.observation}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#065F46',
                      background: '#ECFDF5',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: '1px solid #A7F3D0',
                      marginTop: '6px',
                    }}
                  >
                    <strong>{t('Action Required:', 'প্রয়োজনীয় সংস্কার:', lang)}</strong> {selectedAsset.defectQuery.improvementsRequired}
                  </div>
                </div>
              )}

              {/* Maintenance & Calibration Action */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleLogService(selectedAsset.id)}
                >
                  <CheckCircle size={15} /> {t('Certify Calibration & Service Log', 'ক্যালিব্রেশন ও সার্ভিস প্রত্যয়ন করুন', lang)}
                </button>
                <button
                  className="btn-outline"
                  style={{ width: '100%', justifyContent: 'center', borderColor: '#DC2626', color: '#DC2626' }}
                  onClick={() => setShowRejectModal(true)}
                >
                  <RotateCcw size={15} /> {t('Flag Deficiency / Reject Work Order', 'ক্যালিব্রেশন ত্রুটি বা আপত্তি উত্থাপন করুন', lang)}
                </button>
                <button
                  className="btn-outline"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setShowPassportModal(true)}
                >
                  <Barcode size={15} /> {t('Print High-Durability Metal QR Tag', 'ধাতব কিউআর ট্যাগ প্রিন্ট করুন', lang)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          MODAL 1: REGISTER NEW ASSET TAG
          ══════════════════════════════════════════════════ */}
      {showRegisterModal && (
        <div className="modal-bg" onClick={() => setShowRegisterModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd">
              <div className="modal-hd-left">
                <div className="modal-hd-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="modal-title">{t('Register Heavy Asset / Plant Equipment', 'নতুন মূলধনী সম্পদ নিবন্ধন', lang)}</h3>
                  <div className="modal-subtitle">SAP S/4HANA Asset Accounting (FI-AA) • ASME Sec VIII Class</div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowRegisterModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegisterAsset}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="form-label">{t('Asset Tag Identifier', 'অ্যাসেট ট্যাগ কোড', lang)} *</label>
                    <input
                      className="form-input"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="e.g. BOGCL-KER-PMP-105"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">{t('Equipment Category', 'সরঞ্জাম শ্রেণী', lang)} *</label>
                    <select
                      className="form-input"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                    >
                      <option value="plant">⚙️ Refinery Plant & Columns</option>
                      <option value="vehicle">🚛 Fleet & Tankers</option>
                      <option value="it">💻 SCADA / DCS IT Master</option>
                      <option value="safety">🛡️ Safety & Gas Detection</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label">{t('Equipment / Machine Title', 'যন্ত্রপাতির পূর্ণ নাম', lang)} *</label>
                  <input
                    className="form-input"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Sulzer Multiphase Feed Pump Unit 3"
                    required
                  />
                </div>

                <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="form-label">{t('Assigned Location', 'স্থাপনের অবস্থান', lang)}</label>
                    <input
                      className="form-input"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="e.g. Keraniganj Complex Unit 2"
                    />
                  </div>
                  <div>
                    <label className="form-label">{t('Custodian Engineer / Officer', 'দায়িত্বপ্রাপ্ত কর্মকর্তা', lang)}</label>
                    <input
                      className="form-input"
                      value={newCustodian}
                      onChange={(e) => setNewCustodian(e.target.value)}
                      placeholder="e.g. Engr. Md. Harunur Rashid"
                    />
                  </div>
                </div>

                <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="form-label">{t('Procurement Cost (BDT ৳)', 'ক্রয়মূল্য (টাকা)', lang)}</label>
                    <input
                      className="form-input"
                      type="number"
                      value={newCost}
                      onChange={(e) => setNewCost(e.target.value)}
                      placeholder="4500000"
                    />
                  </div>
                  <div>
                    <label className="form-label">{t('Calibration Cycle (Days)', 'ক্যালিব্রেশন মেয়াদ (দিন)', lang)}</label>
                    <input
                      className="form-input"
                      type="number"
                      value={newDaysToService}
                      onChange={(e) => setNewDaysToService(e.target.value)}
                      placeholder="90"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label">{t('Serial Number & Manufacturer Model', 'সিরিয়াল নম্বর ও মডেল', lang)}</label>
                  <input
                    className="form-input"
                    value={newSerial}
                    onChange={(e) => setNewSerial(e.target.value)}
                    placeholder="e.g. SLZ-BPP-2026-BD"
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label">{t('Technical Operating Specifications', 'প্রযুক্তিগত বৈশিষ্ট্য', lang)}</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={newSpecs}
                    onChange={(e) => setNewSpecs(e.target.value)}
                    placeholder="Operating Temp, Pressure, Voltage, explosion-proof rating..."
                  />
                </div>
              </div>

              <div className="modal-ft">
                <button type="button" className="btn-sm-ghost" onClick={() => setShowRegisterModal(false)}>
                  {t('Cancel', 'বাতিল', lang)}
                </button>
                <button type="submit" className="btn-primary">
                  <CheckCircle size={15} /> {t('Commit Asset Register & Gen Tag', 'সংরক্ষণ ও ট্যাগ তৈরি', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MODAL 2: HIGH-DURABILITY ASSET QR PASSPORT
          ══════════════════════════════════════════════════ */}
      {showPassportModal && selectedAsset && (
        <div className="modal-bg" onClick={() => setShowPassportModal(false)}>
          <div className="modal" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
              <div className="modal-hd-left">
                <div className="modal-hd-icon" style={{ background: 'rgba(255,255,255,0.15)', color: '#FCD34D' }}>
                  <QrCode size={18} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ color: '#fff' }}>
                    {t('Digital Equipment Passport & Metal QR Tag', 'ডিজিটাল সরঞ্জাম পাসপোর্ট ও মেটাল কিউআর ট্যাগ', lang)}
                  </h3>
                  <div className="modal-subtitle" style={{ color: '#94A3B8' }}>
                    ISO 55001 Asset Management • Tamper-Evident Anodized Metal Seal
                  </div>
                </div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowPassportModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Simulated Brushed Stainless Steel Nameplate */}
              <div style={{
                background: 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 50%, #94A3B8 100%)',
                padding: '18px',
                borderRadius: '10px',
                border: '2px solid #64748B',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.15)',
                color: '#0F172A',
                fontFamily: 'monospace',
                marginBottom: '16px',
                position: 'relative',
              }}>
                {/* 4 Screws on Plate Corners */}
                <div style={{ position: 'absolute', top: '8px', left: '8px', width: '8px', height: '8px', borderRadius: '50%', background: '#475569', border: '1px solid #1E293B' }} />
                <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: '#475569', border: '1px solid #1E293B' }} />
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', width: '8px', height: '8px', borderRadius: '50%', background: '#475569', border: '1px solid #1E293B' }} />
                <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: '#475569', border: '1px solid #1E293B' }} />

                <div style={{ textAlign: 'center', borderBottom: '1.5px solid #475569', paddingBottom: '8px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 900, fontSize: '13px', letterSpacing: '1px', color: '#7F1424' }}>
                    BASHUNDHARA OIL & GAS CO. LTD.
                  </div>
                  <div style={{ fontSize: '10px', color: '#334155', fontWeight: 700 }}>
                    KERANIGANJ BITUMEN COMPLEX • CAPITAL ASSET IDENTIFIER
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {/* QR Graphic Box */}
                  <div style={{
                    width: '100px',
                    height: '100px',
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #000'
                  }}>
                    <QrCode size={78} color="#0F172A" />
                    <span style={{ fontSize: '7px', fontWeight: 900, color: '#000' }}>{selectedAsset.tag}</span>
                  </div>

                  {/* Metadata */}
                  <div style={{ flex: 1, fontSize: '11px', lineHeight: 1.5 }}>
                    <div><strong>TAG:</strong> <span style={{ color: '#7F1424', fontWeight: 800 }}>{selectedAsset.tag}</span></div>
                    <div><strong>SERIAL:</strong> {selectedAsset.serialNo}</div>
                    <div><strong>CLASS:</strong> {selectedAsset.category.toUpperCase()} • ZONE 0 ATEX</div>
                    <div><strong>COMMISSIONED:</strong> {selectedAsset.procurementDate}</div>
                    <div><strong>NEXT CAL:</strong> <span style={{ color: selectedAsset.daysToService <= 15 ? '#DC2626' : '#059669', fontWeight: 800 }}>{selectedAsset.nextServiceDate}</span></div>
                  </div>
                </div>

                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #64748B', fontSize: '10px', color: '#1E293B' }}>
                  SPEC: {selectedAsset.specs}
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--brand-slate-600)', lineHeight: 1.5 }}>
                ℹ️ <strong>Field Technician Instructions:</strong> Scan tag using any ATEX Zone-1 intrinsically safe tablet to instantly verify ultrasonic calibration thickness reports and update SCADA telemetry.
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowPassportModal(false)}>
                {t('Close', 'বন্ধ করুন', lang)}
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  showToast(t(`Metal QR plate command dispatched to Keraniganj Laser Etcher for ${selectedAsset.tag}.`, `লেজার প্রিন্টারে প্রেরণ করা হয়েছে।`, lang), 'success');
                  setShowPassportModal(false);
                }}
              >
                <Printer size={15} /> {t('Print Anodized Aluminum Plate', 'অ্যালুমিনিয়াম প্লেট প্রিন্ট', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MODAL 3: SIMULATED AUDIT BARCODE/QR SCANNER
          ══════════════════════════════════════════════════ */}
      {showScanModal && (
        <div className="modal-bg" onClick={() => setShowScanModal(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
              <div className="modal-hd-left">
                <div className="modal-hd-icon" style={{ background: 'rgba(255,255,255,0.15)', color: '#34D399' }}>
                  <Barcode size={18} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ color: '#fff' }}>
                    {t('Laser Barcode & RFID Scanner', 'লেজার বারকোড ও কিউআর স্ক্যানার', lang)}
                  </h3>
                  <div className="modal-subtitle" style={{ color: '#94A3B8' }}>
                    Optical Recognition Active • Aim at machinery nameplate
                  </div>
                </div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowScanModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ textAlign: 'center' }}>
              {/* Camera Viewfinder */}
              <div style={{
                height: '200px',
                background: '#020617',
                borderRadius: '10px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #334155',
                marginBottom: '16px',
              }}>
                {/* Viewfinder Target */}
                <div style={{ width: '130px', height: '130px', border: '2px dashed #10B981', borderRadius: '8px', position: 'relative' }}>
                  {/* Laser Scan line */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: '#EF4444',
                    boxShadow: '0 0 8px #EF4444',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }} />
                </div>
                <div style={{ position: 'absolute', bottom: '10px', fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                  CAMERA: BACK 4K SENSOR • 60 FPS
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--brand-slate-600)', marginBottom: '14px' }}>
                Select a tag to simulate optical scan detection:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {assets.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    className="btn-outline"
                    style={{ justifyContent: 'space-between', padding: '8px 12px', fontSize: '12px' }}
                    onClick={() => {
                      setSelectedAsset(a);
                      setShowScanModal(false);
                      showToast(
                        lang === 'en'
                          ? `✓ Scanned ${a.tag} (${a.name}). Loaded calibration dossier.`
                          : `✓ ট্যাগ ${a.tag} স্ক্যান সম্পন্ন। বিবরণ লোড করা হয়েছে।`,
                        'success'
                      );
                    }}
                  >
                    <span><strong>{a.tag}</strong> — {a.name.slice(0, 24)}...</span>
                    <span className="badge success">Scan Tag</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowScanModal(false)}>
                {t('Close', 'বন্ধ করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calibration Deficiency / Work Order Rejection Modal */}
      {selectedAsset && (
        <RejectionExplanationModal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          onConfirm={handleConfirmAssetReject}
          lang={lang}
          title={t('Flag Calibration Deficiency / Reject Work Order', 'ক্যালিব্রেশন ত্রুটি বা আপত্তি উত্থাপন করুন', lang)}
          itemId={selectedAsset.tag}
          itemTitle={selectedAsset.name}
          requesterName={selectedAsset.custodian}
          department={selectedAsset.location}
          amount={selectedAsset.currentBookValue}
          categoryType="asset"
        />
      )}
    </div>
  );
}

