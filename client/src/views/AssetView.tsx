import React, { useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
import {
  Wrench, ShieldCheck, AlertTriangle, Calendar, Search, Filter,
  Download, Plus, RefreshCw, Barcode, CheckCircle, Clock,
  Cpu, Truck, Gauge, Shield, ChevronRight, Layers, DollarSign
} from 'lucide-react';

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
        };
      }
      return a;
    }));
    showToast(
      lang === 'en'
        ? `Preventive maintenance & calibration certified for ${id}. Next audit scheduled in 180 days.`
        : `${id}-এর রক্ষণাবেক্ষণ ও ক্যালিব্রেশন সফলভাবে লিপিবদ্ধ হয়েছে।`,
      'success'
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
            onClick={() => showToast(t('Asset registration modal opened.', 'নতুন সম্পদ নিবন্ধন উইন্ডো উন্মুক্ত।', lang), 'info')}
          >
            <Plus size={15} /> {t('Register Asset Tag', 'নতুন সম্পদ নিবন্ধন', lang)}
          </button>
          <button
            className="btn-outline"
            onClick={() => showToast(t('QR / Barcode audit scanner active.', 'কিউআর/বারকোড অডিট স্ক্যানার সক্রিয়।', lang), 'info')}
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
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '20px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
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
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => showToast(t(`Generated Asset QR Passport for ${selectedAsset.tag}`, `কিউআর পাসপোর্ট জেনারেট সম্পন্ন`, lang), 'info')}
                >
                  <Barcode size={15} /> {t('Print High-Durability Metal QR Tag', 'ধাতব কিউআর ট্যাগ প্রিন্ট করুন', lang)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
