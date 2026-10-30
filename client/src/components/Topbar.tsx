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
  dashboard:       { section: 'Overview',      sectionBn: 'ড্যাশবোর্ড',    en: 'Workspace Overview',               bn: 'ওয়ার্কস্পেস সারসংক্ষেপ',           sub: 'Daily tasks, pending approvals, alerts & company updates',          subBn: 'দৈনন্দিন কাজ, অনুমোদন ও কোম্পানির সর্বশেষ তথ্য' },
  inner_circle:    { section: 'Leadership',    sectionBn: 'নেতৃত্ব',       en: 'Leadership Messages',              bn: 'নেতৃত্বের বার্তালাপ',               sub: 'Direct messaging, voice notes & official instructions',             subBn: 'বিভাগীয় প্রধানদের সাথে সরাসরি বার্তালাপ ও নির্দেশনা' },
  notesheet:       { section: 'Approvals',     sectionBn: 'অনুমোদন',       en: 'Official Documents & Signatures',  bn: 'দাপ্তরিক নথিপত্র ও স্বাক্ষর',        sub: 'Create, review, compare quotes & sign official company files',      subBn: 'দাপ্তরিক ফাইল তৈরি, দরপত্র তুলনা ও ডিজিটাল স্বাক্ষর' },
  compliance:      { section: 'Permits',       sectionBn: 'লাইসেন্স',      en: 'Permits & License Renewals',       bn: 'লাইসেন্স ও সরকারি অনুমোদন নবায়ন',    sub: '5-step renewal tracker for factory, fire, quality & import permits', subBn: '৫-ধাপ সরকারি লাইসেন্স ও ছাড়পত্র নবায়ন ট্র্যাকার' },
  workforce:       { section: 'HR & Staff',    sectionBn: 'মানবসম্পদ',     en: 'Staff Directory & Exit Clearance', bn: 'কর্মী তালিকা ও বিদায় ছাড়পত্র',       sub: 'Employee profiles, contact details & 4-step exit handover checklist', subBn: 'কর্মীদের প্রোফাইল, তথ্য ও ৪-ধাপ বিদায় ছাড়পত্র' },
  fleet:           { section: 'Transport',     sectionBn: 'পরিবহন',        en: 'Company Vehicles & Trips',         bn: 'অফিসিয়াল গাড়ি ও ট্রিপ ব্যবস্থাপনা',  sub: 'Book office cars, assign drivers, share rides & track fuel slips',   subBn: 'গাড়ি বুকিং, ড্রাইভার বরাদ্দ ও জ্বালানি হিসাব' },
  bus:             { section: 'Transport',     sectionBn: 'পরিবহন',        en: 'Staff Shuttle Buses & Seats',      bn: 'স্টাফ বাস রুট ও সিট তালিকা',         sub: 'Daily staff bus routes, seat assignments & waiting list',            subBn: 'নিয়মিত স্টাফ বাসের রুট, সিট ও অপেক্ষমাণ তালিকা' },
  parcel:          { section: 'Office Mail',   sectionBn: 'পার্সেল',       en: 'Office Mail & Parcel Tracker',     bn: 'অফিস চিঠিপত্র ও পার্সেল ট্র্যাকার',   sub: 'Track documents and samples from dispatch to 4-digit PIN delivery', subBn: 'প্রেরক থেকে প্রাপকের হাতে পৌঁছানো পর্যন্ত ট্র্যাকিং' },
  attendance:      { section: 'HR & Staff',    sectionBn: 'কর্মশক্তি',     en: 'Daily Attendance & Leave',         bn: 'দৈনন্দিন উপস্থিতি ও ছুটি',           sub: 'Daily office/plant check-in, shift roster & leave requests',        subBn: 'অফিস ও প্ল্যান্ট উপস্থিতি, শিফট তালিকা ও ছুটির আবেদন' },
  incident:        { section: 'Safety',        sectionBn: 'নিরাপত্তা',     en: 'Safety & Incident Reports',        bn: 'নিরাপত্তা ও দুর্ঘটনা প্রতিবেদন',      sub: 'Report workplace or road safety issues and track resolution steps',  subBn: 'নিরাপত্তা ঝুঁকি বা ঘটনার রিপোর্ট ও সমাধান ট্র্যাকিং' },
  claims:          { section: 'Finance',       sectionBn: 'অর্থ ও হিসাব',  en: 'Expense & Travel Claims',          bn: 'ভ্রমণ ও যাতায়াত ব্যয় বিল',          sub: 'Submit outstation travel, local transport & office event bills',     subBn: 'ভ্রমণ ভাতা, স্থানীয় যাতায়াত ও অফিস ইভেন্ট বিল দাখিল' },
  asset:           { section: 'Assets',        sectionBn: 'স্থায়ী সম্পদ',  en: 'Company Assets & Equipment',       bn: 'কোম্পানির সম্পদ ও যন্ত্রপাতি',        sub: 'Full lifetime tracking of machinery, vehicles, computers & repairs', subBn: 'যন্ত্রপাতি, গাড়ি ও কম্পিউটারের পূর্ণ জীবনচক্র ও মেরামত হিসাব' },
  guest:           { section: 'Gate Security', sectionBn: 'গেট নিরাপত্তা', en: 'Visitor Gate Passes',              bn: 'অতিথি ও পরিদর্শক গেট পাস',           sub: 'Pre-register guests, print gate passes & log government visits',     subBn: 'অতিথি নিবন্ধন, ডিজিটাল গেট পাস ও পরিদর্শন রেকর্ড' },
  approvals:       { section: 'Approvals',     sectionBn: 'অনুমোদন',       en: 'Pending Approvals Center',         bn: 'অপেক্ষমাণ অনুমোদন কেন্দ্র',           sub: 'Review and approve purchases, expense claims, car bookings & leave', subBn: 'ক্রয় প্রস্তাব, ব্যয় বিল, গাড়ি বুকিং ও ছুটি অনুমোদন' },
  vehicle_request: { section: 'Transport',     sectionBn: 'পরিবহন',        en: 'Book Company Car',                 bn: 'অফিসিয়াল গাড়ি বুকিং',               sub: 'Request an office vehicle for client meetings or plant visits',      subBn: 'দাপ্তরিক কাজের জন্য অফিসের গাড়ির আবেদন' },
};

const DEFAULT_PAGE_META = {
  section: 'Operations',
  sectionBn: 'পরিচালনা',
  en: 'Overview',
  bn: 'সারসংক্ষেপ',
  sub: 'Company operations & daily workflow',
  subBn: 'কোম্পানির দৈনন্দিন কার্যক্রম',
};

const ROLE_ACCESS_LEVEL: Record<AppRole, { en: string; bn: string }> = {
  chairman:        { en: 'Executive Full Access',     bn: 'সর্বোচ্চ নির্বাহী অনুমোদন' },
  plant_gm:        { en: 'Plant Management Access',   bn: 'প্ল্যান্ট ব্যবস্থাপনা অনুমোদন' },
  hr_admin:        { en: 'HR & Admin Management',     bn: 'মানবসম্পদ ও প্রশাসন অনুমোদন' },
  transport_admin: { en: 'Transport & Gate Dispatch', bn: 'পরিবহন ও গেট ব্যবস্থাপনা' },
  hod:             { en: 'Finance & Dept Approver',   bn: 'অর্থ ও বিভাগীয় অনুমোদনকারী' },
  employee:        { en: 'Staff Self-Service',        bn: 'কর্মী সেবা পোর্টাল' },
  driver:          { en: 'Driver Duty Access',        bn: 'ড্রাইভার ডিউটি পোর্টাল' },
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
  const accessLevel = ROLE_ACCESS_LEVEL[role];
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

        {/* Page Heading */}
        <div className="page-heading">
          <h1 className="topbar-page-title">
            {t(page.en, page.bn, lang)}
          </h1>

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
        {/* 1. Global Search Trigger */}
        <button
          className="topbar-search-trigger"
          onClick={onOpenSearch}
          title={t('Quick Search across pages & records (Ctrl+K)', 'পেইজ ও রেকর্ড দ্রুত অনুসন্ধান করুন (Ctrl+K)', lang)}
        >
          <Search size={13} className="search-icon" />
          <span className="search-placeholder">{t('Search pages & files...', 'অনুসন্ধান...', lang)}</span>
          <span className="search-kbd">Ctrl+K</span>
        </button>

        {/* 2. System Sync & Clock Capsule */}
        <div
          className="topbar-telemetry-capsule"
          onClick={() => setShowSapModal(true)}
          title={t('Click to view Accounting, Plant & Payroll Sync Status', 'হিসাব, প্ল্যান্ট ও বেতন সিস্টেম সিঙ্ক স্ট্যাটাস দেখুন', lang)}
        >
          <div className="telemetry-sap">
            <span className="sap-dot" />
            <span className="sap-label">{t('System Synced', 'সিস্টেম সিঙ্ক', lang)}</span>
          </div>
          <span className="telemetry-divider telemetry-hide-mobile" />
          <div className="telemetry-clock telemetry-hide-mobile">
            <Clock size={11} className="clock-icon" />
            <span className="clock-time">{currentTime}</span>
          </div>
        </div>

        {/* 3. Quick Utilities Dock (Notifications, Dark Mode, Language) */}
        <div className="topbar-utility-dock">
          <NotificationCenter role={role} lang={lang} onNavigate={onNavigate} />

          <button
            className="btn-dock-tool"
            onClick={onToggleTheme}
            title={theme === 'light' ? t('Switch to Dark Mode', 'ডার্ক মোড চালু করুন', lang) : t('Switch to Light Mode', 'লাইট মোড চালু করুন', lang)}
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          <button
            className="btn-dock-tool btn-dock-lang"
            onClick={onLangToggle}
            title={t('Switch Language (English / বাংলা)', 'ভাষা পরিবর্তন করুন (English / বাংলা)', lang)}
          >
            <Globe size={13} />
            <span>{lang === 'en' ? 'বাং' : 'EN'}</span>
          </button>
        </div>

        {/* 4. Chairman Announcement Button */}
        {role === 'chairman' && (
          <button
            className="btn-broadcast-compact"
            onClick={onBroadcastOpen}
            title={t('Send Company-Wide Announcement to All Staff', 'সকল কর্মীর উদ্দেশ্যে বিশেষ ঘোষণা পাঠান', lang)}
          >
            <Megaphone size={13} />
            <span className="broadcast-btn-text">{t('Announce', 'ঘোষণা পাঠান', lang)}</span>
          </button>
        )}

        {/* 5. User Profile & Role Switcher Widget */}
        <div className="topbar-user-section" ref={dropdownRef}>
          <div
            className="user-widget-interactive"
            onClick={() => setShowDropdown(!showDropdown)}
            title={t('Click to view profile, handover settings, or switch demo role', 'প্রোফাইল ও সেটিংস দেখতে ক্লিক করুন', lang)}
          >
            <div className="user-avatar" style={{ background: meta.avatarColor }}>
              {meta.initials}
              <span className="avatar-status-dot" />
            </div>
            <div className="user-meta">
              <div className="name">
                <span>{t(meta.name, meta.nameBn, lang)}</span>
                <ChevronDown size={12} className={`chevron-indicator ${showDropdown ? 'open' : ''}`} />
              </div>
              <div className="dept">{t(meta.label, meta.labelBn, lang)}</div>
            </div>
          </div>

          {/* Profile Dropdown Menu */}
          {showDropdown && (
            <div className="user-dropdown-menu">
              <div className="user-dropdown-hd">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div className="user-avatar" style={{ background: meta.avatarColor, width: '42px', height: '42px', fontSize: '15px' }}>
                    {meta.initials}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="name" style={{ fontSize: '13.5px', fontWeight: 800 }}>
                      {t(meta.name, meta.nameBn, lang)}
                    </div>
                    <div className="role" style={{ fontSize: '11px', color: 'var(--brand-gold)' }}>
                      {t(meta.label, meta.labelBn, lang)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', marginTop: '2px', wordBreak: 'break-all' }}>
                      {meta.email}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.08)', padding: '5px 10px', borderRadius: '6px', fontSize: '10px' }}>
                  <span style={{ color: 'var(--brand-gold-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={11} color="var(--brand-gold)" />
                    {t(accessLevel.en, accessLevel.bn, lang)}
                  </span>
                  <span style={{ fontFamily: 'monospace', color: '#38BDF8', fontWeight: 700 }}>{meta.empId}</span>
                </div>
              </div>

              {/* Quick Role Switcher */}
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(0, 0, 0, 0.03)',
                  borderBottom: '1px solid var(--brand-slate-200, #E2E8F0)',
                  boxSizing: 'border-box',
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
                    letterSpacing: '0.5px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Sparkles size={12} color="var(--brand-gold, #D97706)" />
                    {t('Switch Role (Preview)', 'পদবি পরিবর্তন (প্রিভিউ)', lang)}
                  </span>
                  <span style={{ fontSize: '9.5px', color: 'var(--brand-gold, #D97706)', fontWeight: 700 }}>
                    {t('7 Roles', '৭টি পদবি', lang)}
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
                              `Switched to: ${rMeta.name} (${rMeta.label})`,
                              `পদবি পরিবর্তন: ${rMeta.nameBn} (${rMeta.labelBn})`,
                              lang
                            ),
                            'gold'
                          );
                        }}
                        title={`${rMeta.name} (${rMeta.empId}) — ${rMeta.label}`}
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
                          boxSizing: 'border-box',
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
                            flexShrink: 0,
                          }}
                        >
                          {rMeta.initials}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {rMeta.shortName}
                        </span>
                        {isCurrent && <span style={{ fontSize: '10px', color: 'var(--brand-crimson)' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Actions */}
              <div className="user-dropdown-body">
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
                    <div style={{ fontWeight: 600 }}>{t('My Employee Profile', 'আমার কর্মী প্রোফাইল', lang)}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>
                      {t(`${meta.empId} • ${meta.siteLabel}`, `${meta.empId} • ${meta.siteLabelBn}`, lang)}
                    </div>
                  </div>
                  <ChevronRight size={13} color="var(--brand-slate-300)" />
                </div>

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
                    <div style={{ fontWeight: 600 }}>{t('Password & Login Security', 'পাসওয়ার্ড ও নিরাপত্তা', lang)}</div>
                    <div style={{ fontSize: '10.5px', color: '#059669' }}>
                      ✓ {t('2-Step Verification Active', '২-ধাপ নিরাপত্তা যাচাই চালু', lang)}
                    </div>
                  </div>
                  <ChevronRight size={13} color="var(--brand-slate-300)" />
                </div>

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
                    <div style={{ fontWeight: 600 }}>{t('Handover / Out of Office', 'ছুটিকালীন দায়িত্ব হস্তান্তর', lang)}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>
                      {t('Assign an acting colleague during leave or travel', 'ছুটি বা ভ্রমণে বিকল্প দায়িত্বপ্রাপ্ত কর্মকর্তা নির্ধারণ', lang)}
                    </div>
                  </div>
                  <ChevronRight size={13} color="var(--brand-slate-300)" />
                </div>

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
                    <div style={{ fontWeight: 600 }}>{t('Active Devices & Sign-In Log', 'সক্রিয় ডিভাইস ও লগইন ইতিহাস', lang)}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>
                      {t('Manage signed-in computers and mobile phones', 'লগইনকৃত কম্পিউটার ও মোবাইল পরিচালনা', lang)}
                    </div>
                  </div>
                  <ChevronRight size={13} color="var(--brand-slate-300)" />
                </div>

                <div className="user-dropdown-divider" />

                <div
                  className="user-dropdown-item"
                  onClick={() => {
                    setShowDropdown(false);
                    setShowLockScreen(true);
                  }}
                >
                  <Lock size={15} color="var(--brand-slate-600)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{t('Lock Screen', 'স্ক্রিন লক করুন', lang)}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>
                      {t('Temporarily lock your screen with a 4-digit PIN', '৪-সংখ্যার পিন দিয়ে সাময়িকভাবে স্ক্রিন লক করুন', lang)}
                    </div>
                  </div>
                </div>

                <div
                  className="user-dropdown-item danger"
                  onClick={() => {
                    setShowDropdown(false);
                    onLogout();
                  }}
                >
                  <LogOut size={15} color="#DC2626" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#DC2626' }}>{t('Sign Out', 'সাইন আউট করুন', lang)}</div>
                    <div style={{ fontSize: '10.5px', color: '#EF4444' }}>
                      {t('Close session and return to sign-in screen', 'সেশন শেষ করে লগইন পেইজে ফিরে যান', lang)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accounting & System Sync Status Modal */}
      {showSapModal && <SapGatewayModal onClose={() => setShowSapModal(false)} lang={lang} />}

      {/* Employee Profile & Security Modal */}
      {showProfileModal && (
        <UserProfileModal
          role={role}
          lang={lang}
          initialTab={profileModalTab}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Screen Lock Modal */}
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
