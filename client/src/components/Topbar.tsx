import React, { useState, useRef, useEffect } from 'react';
import { AppRole, AppView, Lang, ROLE_META, t } from '../types';
import {
  Globe, Megaphone, ChevronDown, LogOut, Shield, Lock, User,
  Search, Moon, Sun, Clock, ChevronRight, Menu, Key, Award, Sparkles
} from 'lucide-react';
import { showToast } from '../App';
import SapGatewayModal from './SapGatewayModal';
import NotificationCenter from './NotificationCenter';
import UserProfileModal from './UserProfileModal';
import LockScreenModal from './LockScreenModal';

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
  asset:           { section: 'EAM & Fixed Assets', sectionBn: 'স্থায়ী সম্পদ ও রক্ষণাবেক্ষণ', en: 'Enterprise Asset Lifetime & Valuation', bn: 'সম্পদ জীবনচক্র ও অবচয় ব্যবস্থাপনা', sub: 'ISO 55001 cradle-to-grave EAM, IAS 16 depreciation, custody & 10-yr disposal archive', subBn: 'মূলধনী সরঞ্জাম জীবনচক্র, আইএএস ১৬ অবচয়, হেফাজত ও অবলোপন আর্কাইভ' },
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

// Enterprise personnel metadata per role
const USER_CREDENTIALS: Record<AppRole, { email: string; pernr: string; clearance: string }> = {
  chairman:       { email: 'ahmed.sobhan@bashundhara.com',    pernr: 'PERNR-000101', clearance: 'Level-5 Executive' },
  plant_gm:       { email: 'harunur.rashid@bashundhara.com',  pernr: 'PERNR-001042', clearance: 'Level-4 Operations' },
  hr_admin:       { email: 'afroza.sultana@bashundhara.com',  pernr: 'PERNR-001205', clearance: 'Level-4 Compliance' },
  transport_admin:{ email: 'kamruzzaman@bashundhara.com',     pernr: 'PERNR-002410', clearance: 'Level-3 Dispatch' },
  hod:            { email: 'farida.begum@bashundhara.com',    pernr: 'PERNR-001088', clearance: 'Level-4 Signatory' },
  employee:       { email: 'tanvir.ahmed@bashundhara.com',    pernr: 'PERNR-004119', clearance: 'Level-2 Staff' },
  driver:         { email: 'rafiqul.driver@bashundhara.com',  pernr: 'PERNR-008821', clearance: 'Level-1 Duty Transit' },
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
  onToggleMobileMenu?: () => void;
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
  onToggleMobileMenu,
}: TopbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSapModal, setShowSapModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'security' | 'delegation' | 'audit'>('profile');
  const [showLockScreen, setShowLockScreen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const meta = ROLE_META[role];
  const creds = USER_CREDENTIALS[role];
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

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Mobile Menu Hamburger Button */}
        <button
          className="topbar-mobile-hamburger"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
          title="Open Menu"
        >
          <Menu size={20} />
        </button>

        {/* Page Heading: Step 1 (Top) Page Title + Step 2 (Bottom) Small Breadcrumb */}
        <div className="page-heading">
          {/* Top: Primary Page Title */}
          <h1 className="topbar-page-title">
            {t(page.en, page.bn, lang)}
          </h1>

          {/* Bottom (one step bottom): Subdued Breadcrumb with small words */}
          <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
            <span className="crumb-segment crumb-brand">BOGCL OneOps</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-segment crumb-section">{t(page.section, page.sectionBn, lang)}</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-segment crumb-page">{t(page.en, page.bn, lang)}</span>
          </nav>
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
          <span className="telemetry-divider telemetry-hide-mobile" />
          <div className="telemetry-clock telemetry-hide-mobile">
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
            <span className="broadcast-btn-text">{t('Broadcast', 'জরুরি বার্তা', lang)}</span>
          </button>
        )}

        {/* 5. Enterprise Authenticated Identity Widget (Never clipped or hidden) */}
        <div className="topbar-user-section" ref={dropdownRef}>
          <div
            className="user-widget-interactive"
            onClick={() => setShowDropdown(!showDropdown)}
            title="Click to view official employee profile, security & session settings"
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

          {/* Enterprise Profile Dropdown Menu */}
          {showDropdown && (
            <div className="user-dropdown-menu">
              {/* Header with Enterprise Credentials */}
              <div className="user-dropdown-hd">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div className="user-avatar" style={{ background: meta.avatarColor, width: '42px', height: '42px', fontSize: '15px' }}>
                    {meta.initials}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="name" style={{ fontSize: '13.5px', fontWeight: 800 }}>{meta.name}</div>
                    <div className="role" style={{ fontSize: '11px', color: 'var(--brand-gold)' }}>{t(meta.label, meta.labelBn, lang)}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginTop: '2px', wordBreak: 'break-all' }}>{creds.email}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.08)', padding: '5px 10px', borderRadius: '6px', fontSize: '10px' }}>
                  <span style={{ color: 'var(--brand-gold-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={11} color="var(--brand-gold)" />
                    {creds.clearance}
                  </span>
                  <span style={{ fontFamily: 'monospace', color: '#38BDF8', fontWeight: 700 }}>{creds.pernr}</span>
                </div>
              </div>

              {/* Presentation & Demo Persona Quick Switcher */}
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(0, 0, 0, 0.03)',
                  borderBottom: '1px solid var(--brand-slate-200, #E2E8F0)',
                  boxSizing: 'border-box'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--brand-slate-600, #475569)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Sparkles size={12} color="var(--brand-gold, #D97706)" />
                    {t('Switch Persona (Demo Mode)', 'রোল পরিবর্তন (ডেমো মূল্যায়ন)', lang)}
                  </span>
                  <span style={{ fontSize: '9.5px', color: 'var(--brand-gold, #D97706)', fontWeight: 700 }}>
                    7 RBAC Roles
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {(Object.keys(ROLE_META) as AppRole[]).map((r) => {
                    const rMeta = ROLE_META[r];
                    const isCurrent = r === role;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setShowDropdown(false);
                          onRoleChange(r);
                          showToast(
                            t(
                              `Switched persona to: ${rMeta.name} (${t(rMeta.label, rMeta.labelBn, lang)})`,
                              `পদবি পরিবর্তন: ${rMeta.name}`,
                              lang
                            ),
                            'gold'
                          );
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 8px',
                          borderRadius: '6px',
                          border: isCurrent
                            ? '1.5px solid var(--brand-crimson, #A51C30)'
                            : '1px solid var(--brand-slate-200, #E2E8F0)',
                          background: isCurrent
                            ? 'rgba(165, 28, 48, 0.08)'
                            : 'var(--brand-card-bg, #FFFFFF)',
                          color: isCurrent
                            ? 'var(--brand-crimson, #A51C30)'
                            : 'var(--brand-slate-700, #334155)',
                          fontSize: '11px',
                          fontWeight: isCurrent ? 800 : 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          boxSizing: 'border-box'
                        }}
                      >
                        <span
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            background: rMeta.avatarColor,
                            color: '#fff',
                            fontSize: '9px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {rMeta.initials}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {rMeta.name.split(' ')[0]}
                        </span>
                        {isCurrent && <span style={{ fontSize: '10px', color: 'var(--brand-crimson)' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Real Enterprise Software Actions */}
              <div className="user-dropdown-body">
                {/* 1. My Profile & Credentials */}
                <div
                  className="user-dropdown-item"
                  onClick={() => {
                    setShowDropdown(false);
                    setProfileModalTab('profile');
                    setShowProfileModal(true);
                  }}
                >
                  <User size={15} color="var(--brand-slate-600)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{t('My Profile & Credentials', 'আমার প্রোফাইল ও সনদপত্র', lang)}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>{t('Official designation, reporting line & SAP dossier', 'অফিসিয়াল পদবী ও সার্ভিস রেকর্ড', lang)}</div>
                  </div>
                  <ChevronRight size={13} color="var(--brand-slate-300)" />
                </div>

                {/* 2. Security & 2FA */}
                <div
                  className="user-dropdown-item"
                  onClick={() => {
                    setShowDropdown(false);
                    setProfileModalTab('security');
                    setShowProfileModal(true);
                  }}
                >
                  <Key size={15} color="#059669" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{t('Security & 2-Factor Auth (2FA)', 'নিরাপত্তা ও ২-ফ্যাক্টর অথেনটিকেশন', lang)}</div>
                    <div style={{ fontSize: '10.5px', color: '#059669' }}>✓ FIDO2 Key & MFA Enforced</div>
                  </div>
                  <ChevronRight size={13} color="var(--brand-slate-300)" />
                </div>

                {/* 3. Out-of-Office / Delegation */}
                <div
                  className="user-dropdown-item"
                  onClick={() => {
                    setShowDropdown(false);
                    setProfileModalTab('delegation');
                    setShowProfileModal(true);
                  }}
                >
                  <Award size={15} color="#D97706" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{t('Delegation & Out of Office', 'অনুমোদন প্রতিনিধিত্ব (ছুটি/ভ্রমণ)', lang)}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>{t('Assign signing authority during plant visits', 'অনুপস্থিতিতে বিকল্প স্বাক্ষরকারী নির্ধারণ', lang)}</div>
                  </div>
                  <ChevronRight size={13} color="var(--brand-slate-300)" />
                </div>

                {/* 4. Sign-In History & Audit */}
                <div
                  className="user-dropdown-item"
                  onClick={() => {
                    setShowDropdown(false);
                    setProfileModalTab('audit');
                    setShowProfileModal(true);
                  }}
                >
                  <Clock size={15} color="#0284C7" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{t('Sign-In History & Sessions', 'লগইন ইতিহাস ও সেশন', lang)}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>{t('10.14.2.88 (Dhaka HQ Gateway) · 0 failed', '১০.১৪.২.৮৮ (ঢাকা সদর দপ্তর)', lang)}</div>
                  </div>
                  <ChevronRight size={13} color="var(--brand-slate-300)" />
                </div>

                <div className="user-dropdown-divider" />

                {/* 5. Lock Workstation */}
                <div
                  className="user-dropdown-item"
                  onClick={() => {
                    setShowDropdown(false);
                    setShowLockScreen(true);
                  }}
                >
                  <Lock size={15} color="var(--brand-slate-600)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{t('Lock Workstation', 'ওয়ার্কস্টেশন লক করুন', lang)}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>{t('Instant terminal security lock (PIN / Biometric)', 'তাৎক্ষণিক টার্মিনাল লক', lang)}</div>
                  </div>
                  <span style={{ fontSize: '10px', background: 'var(--brand-slate-100)', padding: '2px 5px', borderRadius: '4px', color: 'var(--brand-slate-500)', fontWeight: 700 }}>⌘L</span>
                </div>

                {/* 6. Sign Out / Exit Session */}
                <div
                  className="user-dropdown-item danger"
                  onClick={() => {
                    setShowDropdown(false);
                    onLogout();
                  }}
                >
                  <LogOut size={15} color="#DC2626" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#DC2626' }}>{t('Sign Out / Exit Session', 'সাইন আউট করুন', lang)}</div>
                    <div style={{ fontSize: '10.5px', color: '#EF4444' }}>{t('End S/4HANA session & return to login', 'সেশন সমাপ্ত করে লগইন পেজে ফিরে যান', lang)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SAP Gateway Modal */}
      {showSapModal && <SapGatewayModal onClose={() => setShowSapModal(false)} lang={lang} />}

      {/* Enterprise Personnel Dossier & Security Modal */}
      {showProfileModal && (
        <UserProfileModal
          role={role}
          lang={lang}
          initialTab={profileModalTab}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Workstation Lock Screen */}
      {showLockScreen && (
        <LockScreenModal
          role={role}
          lang={lang}
          onUnlock={() => setShowLockScreen(false)}
          onLogout={() => {
            setShowLockScreen(false);
            onLogout();
          }}
        />
      )}
    </header>
  );
}
