import React from 'react';
import { AppRole, AppView, Lang, t } from '../types';
import {
  Crown, MessageSquare, ClipboardCheck, FileSignature, Menu,
  Gauge, Wrench, AlertTriangle, Truck, Bus, Users,
  MapPin, Receipt, Car, Briefcase
} from 'lucide-react';

interface BottomTab {
  view: AppView;
  label: string;
  labelBn: string;
  icon: React.ReactNode;
  badge?: string;
  badgeType?: 'danger' | 'warn' | 'info';
}

interface MobileBottomNavProps {
  role: AppRole;
  activeView: AppView;
  onNavigate: (v: AppView) => void;
  lang: Lang;
  onOpenMenu: () => void;
}

const ROLE_BOTTOM_TABS: Record<AppRole, BottomTab[]> = {
  chairman: [
    { view: 'dashboard',    label: 'Cockpit',      labelBn: 'কক্পিট',       icon: <Crown size={19} />, badge: '3', badgeType: 'danger' },
    { view: 'inner_circle', label: 'Inner Circle', labelBn: 'ইনার সার্কেল', icon: <MessageSquare size={19} />, badge: '3', badgeType: 'info' },
    { view: 'approvals',    label: 'Approvals',    labelBn: 'অনুমোদন',     icon: <ClipboardCheck size={19} />, badge: '5', badgeType: 'danger' },
    { view: 'notesheet',    label: 'Note-Sheet',   labelBn: 'নোট-শিট',     icon: <FileSignature size={19} /> },
  ],
  plant_gm: [
    { view: 'dashboard',  label: 'Console',    labelBn: 'কনসোল',     icon: <Gauge size={19} />, badge: '4', badgeType: 'warn' },
    { view: 'asset',      label: 'Assets',     labelBn: 'সম্পদ',      icon: <Wrench size={19} /> },
    { view: 'incident',   label: 'HSE Safety', labelBn: 'নিরাপত্তা',  icon: <AlertTriangle size={19} />, badge: '1', badgeType: 'danger' },
    { view: 'notesheet',  label: 'Documents',  labelBn: 'নথিপত্র',    icon: <FileSignature size={19} /> },
  ],
  transport_admin: [
    { view: 'dashboard',  label: 'Fleet Ops',  labelBn: 'ফ্লিট হাব',   icon: <Truck size={19} />, badge: '5', badgeType: 'warn' },
    { view: 'fleet',      label: 'Dispatch',   labelBn: 'গাড়ি প্রেরণ',icon: <Car size={19} /> },
    { view: 'bus',        label: 'Bus FIFO',   labelBn: 'বাস রুট',    icon: <Bus size={19} />, badge: '14', badgeType: 'info' },
    { view: 'guest',      label: 'Gate ALPR',  labelBn: 'গেট পাস',    icon: <Users size={19} /> },
  ],
  hod: [
    { view: 'dashboard',    label: 'Dept Hub',     labelBn: 'বিভাগ হাব',   icon: <Briefcase size={19} /> },
    { view: 'approvals',    label: 'Approvals',    labelBn: 'অনুমোদন',    icon: <ClipboardCheck size={19} />, badge: '5', badgeType: 'danger' },
    { view: 'inner_circle', label: 'Leadership',   labelBn: 'নেতৃত্ব',     icon: <MessageSquare size={19} />, badge: '2', badgeType: 'info' },
    { view: 'notesheet',    label: 'Note-Sheet',   labelBn: 'নোট-শিট',    icon: <FileSignature size={19} /> },
  ],
  hr_admin: [
    { view: 'dashboard',  label: 'HR Cockpit', labelBn: 'এইচআর কক্পিট',icon: <Briefcase size={19} /> },
    { view: 'workforce',  label: 'Workforce',  labelBn: 'কর্মী',       icon: <Users size={19} /> },
    { view: 'approvals',  label: 'Approvals',  labelBn: 'অনুমোদন',     icon: <ClipboardCheck size={19} />, badge: '3', badgeType: 'danger' },
    { view: 'attendance', label: 'Attendance', labelBn: 'উপস্থিতি',    icon: <MapPin size={19} /> },
  ],
  employee: [
    { view: 'dashboard',       label: 'My Portal', labelBn: 'পোর্টাল',   icon: <Briefcase size={19} /> },
    { view: 'attendance',      label: 'Punch In',  labelBn: 'উপস্থিতি',  icon: <MapPin size={19} /> },
    { view: 'claims',          label: 'Claims',    labelBn: 'দাবি বিল',  icon: <Receipt size={19} /> },
    { view: 'vehicle_request', label: 'Transport', labelBn: 'গাড়ি বুক', icon: <Car size={19} /> },
  ],
  driver: [
    { view: 'fleet',           label: 'Missions',   labelBn: 'মিশন',        icon: <Car size={19} />, badge: '1', badgeType: 'warn' },
    { view: 'attendance',      label: 'Sobriety',   labelBn: 'উপস্থিতি',    icon: <MapPin size={19} /> },
    { view: 'claims',          label: 'Toll Slips', labelBn: 'টোল দাবি',   icon: <Receipt size={19} /> },
    { view: 'dashboard',       label: 'Terminal',   labelBn: 'টার্মিনাল',    icon: <Briefcase size={19} /> },
  ],
};

export default function MobileBottomNav({
  role,
  activeView,
  onNavigate,
  lang,
  onOpenMenu,
}: MobileBottomNavProps) {
  const tabs = ROLE_BOTTOM_TABS[role] || ROLE_BOTTOM_TABS.chairman;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="mobile-bottom-nav-inner">
        {tabs.map((tab) => {
          const isActive = activeView === tab.view;
          return (
            <button
              key={tab.view}
              type="button"
              className={`mobile-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(tab.view)}
            >
              <div className="mobile-tab-icon-wrap">
                {tab.icon}
                {tab.badge && (
                  <span className={`mobile-tab-badge ${tab.badgeType || 'danger'}`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="mobile-tab-label">{t(tab.label, tab.labelBn, lang)}</span>
              {isActive && <span className="mobile-tab-indicator" />}
            </button>
          );
        })}

        {/* 5th Tab: Master Drawer Menu */}
        <button
          type="button"
          className="mobile-tab-btn mobile-tab-more"
          onClick={onOpenMenu}
          aria-label="Open Full Menu"
        >
          <div className="mobile-tab-icon-wrap">
            <Menu size={20} />
          </div>
          <span className="mobile-tab-label">{t('All Modules', 'মেনু', lang)}</span>
        </button>
      </div>
    </nav>
  );
}
