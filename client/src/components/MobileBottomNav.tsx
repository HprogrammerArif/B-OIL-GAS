import React from 'react';
import { AppRole, AppView, Lang, t } from '../types';
import {
  Crown, MessageSquare, ClipboardCheck, FileSignature, Menu,
  Gauge, Wrench, AlertTriangle, Truck, Bus, Users,
  MapPin, Receipt, Car, Briefcase
} from 'lucide-react';
import { useLiveNavBadges } from './Sidebar';

interface BottomTab {
  view: AppView;
  label: string;
  labelBn: string;
  icon: React.ReactNode;
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
    { view: 'dashboard',    label: 'Overview',   labelBn: 'ড্যাশবোর্ড', icon: <Crown size={19} /> },
    { view: 'inner_circle', label: 'Messages',   labelBn: 'বার্তালাপ',  icon: <MessageSquare size={19} /> },
    { view: 'approvals',    label: 'Approvals',  labelBn: 'অনুমোদন',    icon: <ClipboardCheck size={19} /> },
    { view: 'notesheet',    label: 'Documents',  labelBn: 'নথিপত্র',    icon: <FileSignature size={19} /> },
  ],
  plant_gm: [
    { view: 'dashboard',    label: 'Overview',   labelBn: 'ড্যাশবোর্ড', icon: <Gauge size={19} /> },
    { view: 'asset',        label: 'Machinery',  labelBn: 'যন্ত্রপাতি', icon: <Wrench size={19} /> },
    { view: 'incident',     label: 'Safety',     labelBn: 'নিরাপত্তা',  icon: <AlertTriangle size={19} /> },
    { view: 'notesheet',    label: 'Documents',  labelBn: 'নথিপত্র',    icon: <FileSignature size={19} /> },
  ],
  transport_admin: [
    { view: 'dashboard',    label: 'Overview',   labelBn: 'ড্যাশবোর্ড', icon: <Truck size={19} /> },
    { view: 'fleet',        label: 'Vehicles',   labelBn: 'গাড়ি বরাদ্দ',icon: <Car size={19} /> },
    { view: 'bus',          label: 'Buses',      labelBn: 'স্টাফ বাস',  icon: <Bus size={19} /> },
    { view: 'guest',        label: 'Visitors',   labelBn: 'অতিথি পাস',  icon: <Users size={19} /> },
  ],
  hod: [
    { view: 'dashboard',    label: 'Overview',   labelBn: 'ড্যাশবোর্ড', icon: <Briefcase size={19} /> },
    { view: 'approvals',    label: 'Approvals',  labelBn: 'অনুমোদন',    icon: <ClipboardCheck size={19} /> },
    { view: 'claims',       label: 'Claims',     labelBn: 'ব্যয় বিল',   icon: <Receipt size={19} /> },
    { view: 'notesheet',    label: 'Documents',  labelBn: 'নথিপত্র',    icon: <FileSignature size={19} /> },
  ],
  hr_admin: [
    { view: 'dashboard',    label: 'HR Home',    labelBn: 'ড্যাশবোর্ড', icon: <Briefcase size={19} /> },
    { view: 'workforce',    label: 'Staff',      labelBn: 'কর্মী',      icon: <Users size={19} /> },
    { view: 'approvals',    label: 'Approvals',  labelBn: 'অনুমোদন',    icon: <ClipboardCheck size={19} /> },
    { view: 'attendance',   label: 'Attendance', labelBn: 'উপস্থিতি',   icon: <MapPin size={19} /> },
  ],
  employee: [
    { view: 'dashboard',    label: 'Home',       labelBn: 'হোম',        icon: <Briefcase size={19} /> },
    { view: 'attendance',   label: 'Attendance', labelBn: 'উপস্থিতি',   icon: <MapPin size={19} /> },
    { view: 'claims',       label: 'Claims',     labelBn: 'ব্যয় বিল',   icon: <Receipt size={19} /> },
    { view: 'fleet',        label: 'Book Car',   labelBn: 'গাড়ি বুকিং', icon: <Car size={19} /> },
  ],
  driver: [
    { view: 'dashboard',    label: 'Home',       labelBn: 'হোম',        icon: <Briefcase size={19} /> },
    { view: 'fleet',        label: 'My Trips',   labelBn: 'ট্রিপ',       icon: <Car size={19} /> },
    { view: 'attendance',   label: 'Check-In',   labelBn: 'উপস্থিতি',   icon: <MapPin size={19} /> },
    { view: 'claims',       label: 'Toll Slips', labelBn: 'টোল স্লিপ',  icon: <Receipt size={19} /> },
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
  const liveBadges = useLiveNavBadges(role);
  const normalizedActiveView: AppView = activeView === 'vehicle_request' ? 'fleet' : activeView;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="mobile-bottom-nav-inner">
        {tabs.map((tab) => {
          const isActive = normalizedActiveView === tab.view;
          const badge = liveBadges[tab.view];
          return (
            <button
              key={tab.view}
              type="button"
              className={`mobile-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(tab.view)}
            >
              <div className="mobile-tab-icon-wrap">
                {tab.icon}
                {badge && (
                  <span className={`mobile-tab-badge ${badge.type || 'danger'}`}>
                    {badge.text}
                  </span>
                )}
              </div>
              <span className="mobile-tab-label">{t(tab.label, tab.labelBn, lang)}</span>
              {isActive && <span className="mobile-tab-indicator" />}
            </button>
          );
        })}

        {/* 5th Tab: Full Drawer Menu */}
        <button
          type="button"
          className="mobile-tab-btn mobile-tab-more"
          onClick={onOpenMenu}
          aria-label="Open Full Menu"
        >
          <div className="mobile-tab-icon-wrap">
            <Menu size={20} />
          </div>
          <span className="mobile-tab-label">{t('More', 'মেনু', lang)}</span>
        </button>
      </div>
    </nav>
  );
}
