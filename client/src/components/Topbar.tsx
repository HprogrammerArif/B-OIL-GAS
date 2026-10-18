import React, { useState, useRef, useEffect } from 'react';
import { AppRole, AppView, Lang, ROLE_META, t } from '../types';
import {
  Globe, Megaphone, ChevronDown, LogOut, RefreshCw, Shield, Lock, User,
  Search, Moon, Sun, Clock, ChevronRight
} from 'lucide-react';
import { showToast } from '../App';
import SapGatewayModal from './SapGatewayModal';
import NotificationCenter from './NotificationCenter';

const ROLES: { key: AppRole; emoji: string; label: string; labelBn: string }[] = [
  { key: 'chairman',       emoji: '👑', label: 'Chairman & MD',          labelBn: 'চেয়ারম্যান ও এমডি' },
  { key: 'plant_gm',       emoji: '🏭', label: 'Plant General Manager',  labelBn: 'প্ল্যান্ট জেনারেল ম্যানেজার' },
  { key: 'hr_admin',       emoji: '👥', label: 'HR & Corporate Services GM', labelBn: 'জিএম, এইচআর ও মানবসম্পদ' },
  { key: 'transport_admin',emoji: '🚚', label: 'Transport & Admin Super',labelBn: 'পরিবহন ও প্রশাসন পরিদর্শক' },
  { key: 'hod',            emoji: '📋', label: 'HOD / Chief Approver',   labelBn: 'বিভাগীয় প্রধান / অর্থ পরিচালক' },
  { key: 'employee',       emoji: '👷', label: 'Staff Self-Service',     labelBn: 'কর্মচারী পোর্টাল' },
];

const PAGE_META: Record<string, { section: string; sectionBn: string; en: string; bn: string; sub: string; subBn: string }> = {
  dashboard:       { section: 'Governance',  sectionBn: 'গভর্ন্যান্স', en: 'Executive Cockpit',                  bn: 'এক্সিকিউটিভ কক্পিট',                 sub: 'Real-time enterprise intelligence & multi-tier governance',        subBn: 'রিয়েল-টাইম এন্টারপ্রাইজ ইন্টেলিজেন্স' },
  inner_circle:    { section: 'Executive',   sectionBn: 'এক্সিকিউটিভ', en: "Chairman's Inner Circle Messaging",  bn: 'ইনার সার্কেল মেসেজিং',             sub: 'Confidential encrypted communication channel with key leadership', subBn: 'শীর্ষ নেতৃত্বের সাথে নিরাপদ এনক্রিপ্টেড বার্তালাপ' },
  notesheet:       { section: 'Governance',  sectionBn: 'গভর্ন্যান্স', en: 'Note-Sheet & E-Signature',           bn: 'নোট-শিট ও ই-স্বাক্ষর',             sub: 'Digital file approval with tamper-proof cryptographic audit trail', subBn: 'ডিজিটাল ফাইল অনুমোদন ও ই-স্বাক্ষর' },
  compliance:      { section: 'Governance',  sectionBn: 'গভর্ন্যান্স', en: 'BSTI & Regulatory Pipeline',         bn: 'বিএসটিআই লাইসেন্স পাইপলাইন',       sub: '5-stage visual kanban for all statutory license renewals',          subBn: '৫-ধাপ আইনি লাইসেন্স নবায়ন প্রক্রিয়া' },
  workforce:       { section: 'Human Capital', sectionBn: 'মানবসম্পদ', en: 'Workforce Master & Exit Clearance', bn: 'কর্মী মাস্টার ও ছাড়পত্র', sub: 'Employee directory, SAP PERNR sync & 4-way exit clearance checklist', subBn: 'কর্মী মাস্টার, এসএপি সিঙ্ক ও ৪-ধাপ বহির্গমন ছাড়পত্র' },
  fleet:           { section: 'Operations',  sectionBn: 'লজিস্টিক্স',  en: 'Fleet & Ride Pooling',                bn: 'ফ্লিট ও রাইড পুলিং',                sub: 'Smart vehicle dispatch, pooling suggestions & fuel audit',          subBn: 'যানবাহন বরাদ্দ ও পুলিং ব্যবস্থাপনা' },
  bus:             { section: 'Operations',  sectionBn: 'লজিস্টিক্স',  en: 'Bus Seat FIFO Waitlist',              bn: 'বাস সিট ওয়েটলিস্ট',                sub: 'Transparent FIFO allocation with auto-cascade on seat vacancy',     subBn: 'ন্যায্য ফিফো পদ্ধতিতে বাস সিট বরাদ্দ' },
  parcel:          { section: 'Operations',  sectionBn: 'লজিস্টিক্স',  en: 'Parcel Chain-of-Custody',             bn: 'পার্সেল চেইন-অব-কাস্টডি',           sub: 'QR-based custody tracking from sender to recipient OTP delivery',   subBn: 'কিউআর ভিত্তিক পার্সেল ট্র্যাকিং' },
  attendance:      { section: 'Workforce',   sectionBn: 'কর্মশক্তি',   en: 'Geofenced Mobile Attendance',         bn: 'জিওফেন্স অ্যাটেন্ডেন্স',            sub: 'Anti-spoof server-side Haversine geofence validation',              subBn: 'মোবাইল ভিত্তিক উপস্থিতি নথিভুক্তি' },
  incident:        { section: 'Safety',      sectionBn: 'নিরাপত্তা',   en: 'HSE Incident Management & CAPA',       bn: 'এইচএসই ইনসিডেন্ট ম্যানেজমেন্ট',       sub: 'OSHA-compliant incident triage, root cause analysis & CAPA',       subBn: 'নিরাপত্তা ঘটনা প্রতিবেদন ও সংশোধনী পদক্ষেপ' },
  claims:          { section: 'Finance',     sectionBn: 'অর্থায়ন',    en: 'TA / DA & Conveyance Claims',         bn: 'টিএ/ডিএ ও যাতায়াত দাবি',           sub: 'Tour expense requisitions, per diem calculation & local travel',     subBn: 'ভ্রমণ ব্যয়, দৈনিক ভাতা ও যাতায়াত বিল ব্যবস্থাপনা' },
  asset:           { section: 'Reliability', sectionBn: 'রক্ষণাবেক্ষণ', en: 'Asset Lifecycle & Maintenance',     bn: 'সম্পদ জীবনচক্র ও রক্ষণাবেক্ষণ',      sub: 'Capital equipment register, calibration tracking & audit alerts',    subBn: 'মূলধনী সরঞ্জাম তালিকা ও ক্যালিব্রেশন সময়সূচি' },
  guest:           { section: 'Security',    sectionBn: 'নিরাপত্তা',   en: 'Guest & VIP Protocol Gate Pass',      bn: 'অতিথি ও ভিআইপি প্রটোকল গেট পাস',    sub: 'Digital QR passes, regulatory inspection audits & VIP protocol',     subBn: 'ডিজিটাল কিউআর গেট পাস ও ভিআইপি প্রটোকল' },
  approvals:       { section: 'Governance',  sectionBn: 'গভর্ন্যান্স', en: 'Unified Approval Queue',              bn: 'ইউনিফায়েড অনুমোদন সারি',           sub: 'Consolidated approval inbox across leaves, claims, and requisitions', subBn: 'ছুটি, ব্যয় ও ক্রয় রিকুইজিশন অনুমোদন' },
  vehicle_request: { section: 'Operations',  sectionBn: 'লজিস্টিক্স',  en: 'Vehicle Booking Request',             bn: 'গাড়ির অনুরোধ',                     sub: 'Self-service pool car and logistics travel requisition',            subBn: 'অফিসিয়াল যাতায়াত ও গাড়ি বুকিং' },
};

const DEFAULT_PAGE_META = {
  section: 'Operations',
  sectionBn: 'অপারেশন',
  en: 'Overview',
  bn: 'সংক্ষিপ্ত বিবরণ',
  sub: 'Operational console & enterprise workflow',
  subBn: 'অপারেশনাল কনসোল',
};

interface TopbarProps {
  role: AppRole;
  lang: Lang;
  view: AppView;
  theme: 'light' | 'dark';
  onRoleChange: (r: AppRole) => void;
  onLangToggle: () => void;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onNavigate: (v: AppView) => void;
  onBroadcastOpen: () => void;
  onLogout: () => void;
}

export default function Topbar({
  role,
  lang,
  view,
  theme,
  onRoleChange,
  onLangToggle,
  onToggleTheme,
  onOpenSearch,
  onNavigate,
  onBroadcastOpen,
  onLogout,
}: TopbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSapModal, setShowSapModal] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const meta = ROLE_META[role];
  const page = PAGE_META[view] || DEFAULT_PAGE_META;

  // Real-time ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      setCurrentTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSelect = (newRole: AppRole) => {
    onRoleChange(newRole);
    setShowDropdown(false);
    showToast(t(`Switched role to ${ROLE_META[newRole].name}`, `${ROLE_META[newRole].name} হিসেবে স্যুইচ করা হয়েছে`, lang), 'info');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Breadcrumb & Page Title */}
        <div className="page-heading">
          <div className="breadcrumb-trail">
            <span className="brand-badge-pill">BOGCL OneOps</span>
            <ChevronRight size={12} className="breadcrumb-sep" />
            <span className="breadcrumb-section">{t(page.section, page.sectionBn, lang)}</span>
            <ChevronRight size={12} className="breadcrumb-sep" />
            <h2 className="breadcrumb-current">{t(page.en, page.bn, lang)}</h2>
          </div>
          <p className="page-subtitle">{t(page.sub, page.subBn, lang)}</p>
        </div>
      </div>

      <div className="topbar-right">
        {/* 1. Global Search / Command Palette Trigger */}
        <button
          className="topbar-search-trigger"
          onClick={onOpenSearch}
          title="Global Search & Quick Command Palette (Ctrl+K / ⌘K)"
        >
          <Search size={13} className="search-icon" />
          <span className="search-placeholder">{t('Search OneOps...', 'অনুসন্ধান...', lang)}</span>
          <span className="search-kbd">⌘K</span>
        </button>

        {/* 2. Unified Enterprise Telemetry Capsule (SAP Sync + Clock) */}
        <div
          className="topbar-telemetry-capsule"
          onClick={() => setShowSapModal(true)}
          title="BOGCL S/4HANA Gateway: Live · Precision Dhaka Time (BST / UTC+6)"
        >
          <div className="telemetry-sap">
            <span className="sap-dot" />
            <span className="sap-label">SAP Live</span>
          </div>
          <span className="telemetry-divider" />
          <div className="telemetry-clock">
            <Clock size={11} className="clock-icon" />
            <span className="clock-time">{currentTime}</span>
          </div>
        </div>

        {/* 3. Quick Utilities Dock (Notifications, Dark Mode, Language) */}
        <div className="topbar-utility-dock">
          {/* Notification Center */}
          <NotificationCenter lang={lang} onNavigate={onNavigate} />

          {/* Dark / Light Mode Toggle */}
          <button
            className="btn-dock-tool"
            onClick={onToggleTheme}
            title={theme === 'light' ? t('Switch to Dark Mode', 'ডার্ক মোড চালু করুন', lang) : t('Switch to Light Mode', 'লাইট মোড চালু করুন', lang)}
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          {/* Language Toggle */}
          <button
            className="btn-dock-tool btn-dock-lang"
            onClick={onLangToggle}
            title="Switch Interface Language (English / বাংলা)"
          >
            <Globe size={13} />
            <span>{lang === 'en' ? 'বাং' : 'EN'}</span>
          </button>
        </div>

        {/* 4. Executive Strategic Action (Chairman Broadcast) */}
        {role === 'chairman' && (
          <button
            className="btn-broadcast-compact"
            onClick={onBroadcastOpen}
            title="Dispatch Sovereign Alert Broadcast to Leadership"
          >
            <Megaphone size={13} />
            <span>{t('Broadcast', 'জরুরি বার্তা', lang)}</span>
          </button>
        )}

        {/* 5. Executive Persona & Identity Widget */}
        <div className="topbar-user-section" ref={dropdownRef}>
          <div
            className="user-widget-interactive"
            onClick={() => setShowDropdown(!showDropdown)}
            title="Click to view profile or switch role"
          >
            <div className="user-avatar" style={{ background: meta.avatarColor }}>
              {meta.initials}
              <span className="avatar-status-dot" />
            </div>
            <div className="user-meta">
              <div className="name">
                <span>{meta.name}</span>
                <ChevronDown size={12} className={`chevron-indicator ${showDropdown ? 'open' : ''}`} />
              </div>
              <div className="dept">{t(meta.label, meta.labelBn, lang)}</div>
            </div>
          </div>

          {/* Profile Dropdown Menu */}
          {showDropdown && (
            <div className="user-dropdown-menu">
              <div className="user-dropdown-hd">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div className="user-avatar" style={{ background: meta.avatarColor, width: '40px', height: '40px' }}>
                    {meta.initials}
                  </div>
                  <div>
                    <div className="name">{meta.name}</div>
                    <div className="role">{t(meta.label, meta.labelBn, lang)}</div>
                  </div>
                </div>
                <div className="dept">📍 {meta.dept}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '10px', color: 'var(--brand-gold-light)' }}>
                  <Shield size={12} color="var(--brand-gold)" />
                  <span>Security Clearance: Level-5 (Executive Access)</span>
                </div>
              </div>

              <div className="user-dropdown-body">
                <div style={{ padding: '8px 16px 4px', fontSize: '10.5px', fontWeight: 700, color: 'var(--brand-slate-400)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  {t('Switch Persona for Demo', 'ডেমো উপস্থাপনার জন্য ভূমিকা পরিবর্তন', lang)}
                </div>

                {ROLES.map((r) => {
                  const isCurrent = role === r.key;
                  return (
                    <div
                      key={r.key}
                      className="user-dropdown-item"
                      style={{
                        background: isCurrent ? 'var(--brand-slate-100)' : 'transparent',
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? 'var(--brand-crimson)' : 'inherit',
                      }}
                      onClick={() => handleRoleSelect(r.key)}
                    >
                      <span>{r.emoji}</span>
                      <span style={{ flex: 1 }}>{t(r.label, r.labelBn, lang)}</span>
                      {isCurrent && <span className="badge success" style={{ fontSize: '9px', padding: '1px 5px' }}>Active</span>}
                    </div>
                  );
                })}

                <div className="user-dropdown-divider"></div>

                <div
                  className="user-dropdown-item"
                  onClick={() => {
                    setShowDropdown(false);
                    showToast(t('Terminal locked. Password required to wake.', 'টার্মিনাল লক করা হয়েছে।', lang), 'info');
                  }}
                >
                  <Lock size={14} />
                  <span>{t('Lock Workstation', 'ওয়ার্কস্টেশন লক করুন', lang)}</span>
                </div>

                <div
                  className="user-dropdown-item danger"
                  onClick={() => {
                    setShowDropdown(false);
                    onLogout();
                  }}
                >
                  <LogOut size={14} />
                  <span>{t('Sign Out / Exit Session', 'সাইন আউট করুন', lang)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {showSapModal && <SapGatewayModal onClose={() => setShowSapModal(false)} lang={lang} />}
    </header>
  );
}
