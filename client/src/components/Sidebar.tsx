import React from 'react';
import { AppRole, AppView, Lang, ROLE_META, t } from '../types';
import {
  LayoutDashboard, FileSignature, ShieldCheck, Truck, Bus,
  Package, MapPin, AlertTriangle, ChevronLeft, ChevronRight,
  MessageSquare, Crown, Gauge, ClipboardCheck, Users,
  Wrench, CalendarClock, UserCheck, Receipt, Car,
  Building2, Shield, Briefcase, Bell, BarChart3, X
} from 'lucide-react';

interface SidebarProps {
  role: AppRole;
  activeView: AppView;
  onNavigate: (v: AppView) => void;
  lang: Lang;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavEntry {
  view: AppView;
  icon: React.ReactNode;
  label: string;
  labelBn: string;
  badge?: string;
  badgeType?: string;
}

interface NavSection {
  title: string;
  titleBn: string;
  items: NavEntry[];
}

/* ────────────────────────────────────────────
   Role-specific navigation configurations.
   Each role gets a COMPLETELY DIFFERENT sidebar.
   ──────────────────────────────────────────── */

const CHAIRMAN_NAV: NavSection[] = [
  {
    title: 'Strategic Command',
    titleBn: 'কৌশলগত কমান্ড',
    items: [
      { view: 'dashboard',     icon: <Crown size={16} />,          label: 'Executive Command Center',     labelBn: 'এক্সিকিউটিভ কমান্ড সেন্টার', badge: '3', badgeType: 'danger' },
      { view: 'inner_circle',  icon: <MessageSquare size={16} />,  label: "Inner Circle Messaging",       labelBn: 'ইনার সার্কেল মেসেজিং',       badge: '3', badgeType: 'info' },
      { view: 'approvals',     icon: <ClipboardCheck size={16} />, label: 'Consolidated Approval Inbox',   labelBn: 'সম্মিলিত অনুমোদন ইনবক্স',     badge: '5', badgeType: 'danger' },
      { view: 'notesheet',     icon: <FileSignature size={16} />,  label: 'Priority Authorizations',      labelBn: 'অগ্রাধিকার অনুমোদন' },
    ],
  },
  {
    title: 'Oversight & Risk',
    titleBn: 'তত্ত্বাবধান ও ঝুঁকি',
    items: [
      { view: 'compliance',    icon: <ShieldCheck size={16} />,    label: 'License & Regulatory Risk',    labelBn: 'লাইসেন্স ও নিয়ন্ত্রক ঝুঁকি', badge: '5', badgeType: 'warn' },
      { view: 'guest',         icon: <Users size={16} />,          label: 'VIP Protocol & Inspections',   labelBn: 'ভিআইপি ও পরিদর্শক প্রটোকল', badge: '1 VIP', badgeType: 'danger' },
      { view: 'incident',      icon: <AlertTriangle size={16} />, label: 'HSE Incident Monitor',         labelBn: 'এইচএসই ইনসিডেন্ট মনিটর',     badge: '1', badgeType: 'danger' },
      { view: 'attendance',    icon: <BarChart3 size={16} />,      label: 'Workforce Analytics',          labelBn: 'কর্মশক্তি বিশ্লেষণ' },
      { view: 'workforce',     icon: <Users size={16} />,          label: 'Workforce & Talent Master',    labelBn: 'কর্মী ও মেধা মাস্টার' },
    ],
  },
];

const PLANT_GM_NAV: NavSection[] = [
  {
    title: 'Plant Operations',
    titleBn: 'প্ল্যান্ট অপারেশন',
    items: [
      { view: 'dashboard',     icon: <Gauge size={16} />,          label: 'Plant Operations Console',     labelBn: 'প্ল্যান্ট অপারেশন কনসোল',   badge: '4', badgeType: 'warn' },
      { view: 'asset',         icon: <Wrench size={16} />,         label: 'Plant Assets & Reliability',   labelBn: 'প্ল্যান্ট সম্পদ ও রক্ষণাবেক্ষণ', badge: '28d', badgeType: 'warn' },
      { view: 'notesheet',     icon: <FileSignature size={16} />,  label: 'Work Orders & Documents',      labelBn: 'কার্যাদেশ ও নথি' },
      { view: 'incident',      icon: <AlertTriangle size={16} />, label: 'HSE & Safety CAPA',            labelBn: 'এইচএসই ও নিরাপত্তা',         badge: '1', badgeType: 'danger' },
    ],
  },
  {
    title: 'Plant Management',
    titleBn: 'প্ল্যান্ট ব্যবস্থাপনা',
    items: [
      { view: 'compliance',    icon: <ShieldCheck size={16} />,    label: 'Plant Licenses & Audit',       labelBn: 'প্ল্যান্ট লাইসেন্স ও অডিট', badge: '90d', badgeType: 'warn' },
      { view: 'guest',         icon: <Users size={16} />,          label: 'Regulatory Inspections (DoE)',  labelBn: 'সরকারি পরিদর্শক তালিকা',   badge: 'DoE', badgeType: 'info' },
      { view: 'attendance',    icon: <CalendarClock size={16} />,  label: 'Shift Roster & Attendance',    labelBn: 'শিফট রোস্টার ও উপস্থিতি' },
      { view: 'parcel',        icon: <Package size={16} />,        label: 'Material & Parcel Tracker',    labelBn: 'উপকরণ ও পার্সেল ট্র্যাকার' },
    ],
  },
];

const TRANSPORT_ADMIN_NAV: NavSection[] = [
  {
    title: 'Fleet Command',
    titleBn: 'ফ্লিট কমান্ড',
    items: [
      { view: 'dashboard',     icon: <Truck size={16} />,          label: 'Fleet Command Center',         labelBn: 'ফ্লিট কমান্ড সেন্টার',       badge: '5', badgeType: 'warn' },
      { view: 'fleet',         icon: <Car size={16} />,            label: 'Vehicle Dispatch & Assign',    labelBn: 'গাড়ি প্রেরণ ও বরাদ্দ' },
      { view: 'bus',           icon: <Bus size={16} />,            label: 'Bus Routes & Seat FIFO',       labelBn: 'বাস রুট ও সিট ওয়েটলিস্ট',   badge: '14', badgeType: 'info' },
      { view: 'asset',         icon: <Wrench size={16} />,         label: 'Heavy Fleet Asset Register',   labelBn: 'ভারী বহর সম্পদ তালিকা' },
    ],
  },
  {
    title: 'Admin Operations',
    titleBn: 'প্রশাসন পরিচালনা',
    items: [
      { view: 'guest',         icon: <Users size={16} />,          label: 'Visitor Pass & Gate ALPR',     labelBn: 'অতিথি পাস ও গেট প্রটোকল',   badge: '4 Inside', badgeType: 'info' },
      { view: 'parcel',        icon: <Package size={16} />,        label: 'Parcel Dispatch & Tracking',   labelBn: 'পার্সেল প্রেরণ ও ট্র্যাকিং' },
      { view: 'attendance',    icon: <MapPin size={16} />,         label: 'Staff Check-In Monitor',       labelBn: 'কর্মী চেক-ইন মনিটর' },
      { view: 'notesheet',     icon: <FileSignature size={16} />,  label: 'Admin Documents',              labelBn: 'প্রশাসনিক নথি' },
    ],
  },
];

const HOD_NAV: NavSection[] = [
  {
    title: 'Department Governance',
    titleBn: 'বিভাগীয় গভর্ন্যান্স',
    items: [
      { view: 'dashboard',     icon: <Briefcase size={16} />,      label: 'Department Governance Hub',    labelBn: 'বিভাগীয় গভর্ন্যান্স হাব',   badge: '7', badgeType: 'warn' },
      { view: 'inner_circle',  icon: <MessageSquare size={16} />,  label: 'Executive Leadership Comm',    labelBn: 'শীর্ষ নেতৃত্ব যোগাযোগ',     badge: '2', badgeType: 'info' },
      { view: 'approvals',     icon: <ClipboardCheck size={16} />, label: 'Unified Approval Inbox',       labelBn: 'ইউনিফায়েড অনুমোদন ইনবক্স', badge: '5', badgeType: 'danger' },
      { view: 'notesheet',     icon: <FileSignature size={16} />,  label: 'Note-Sheet & E-Sign',          labelBn: 'নোট-শীট ও ই-স্বাক্ষর' },
      { view: 'compliance',    icon: <ShieldCheck size={16} />,    label: 'Dept Compliance Tracker',      labelBn: 'বিভাগীয় কমপ্লায়েন্স' },
    ],
  },
  {
    title: 'Team & Finance',
    titleBn: 'দল ও অর্থায়ন',
    items: [
      { view: 'claims',        icon: <Receipt size={16} />,        label: 'Team TA/DA & Conveyance',      labelBn: 'দলীয় টিএ/ডিএ ও যাতায়াত',     badge: '৳20.2k', badgeType: 'warn' },
      { view: 'attendance',    icon: <UserCheck size={16} />,      label: 'Team Attendance & Leave',      labelBn: 'দলীয় উপস্থিতি ও ছুটি' },
      { view: 'workforce',     icon: <Users size={16} />,          label: 'Dept Staff Directory',         labelBn: 'বিভাগীয় কর্মী তালিকা' },
      { view: 'incident',      icon: <AlertTriangle size={16} />, label: 'Dept Incidents & Actions',     labelBn: 'বিভাগীয় ঘটনা ও পদক্ষেপ' },
      { view: 'fleet',         icon: <Car size={16} />,            label: 'Vehicle Requests',             labelBn: 'গাড়ির অনুরোধ' },
    ],
  },
];

const EMPLOYEE_NAV: NavSection[] = [
  {
    title: 'My Workspace',
    titleBn: 'আমার ওয়ার্কস্পেস',
    items: [
      { view: 'dashboard',     icon: <LayoutDashboard size={16} />,label: 'My Work Hub',                  labelBn: 'আমার ওয়ার্ক হাব' },
      { view: 'attendance',    icon: <MapPin size={16} />,         label: 'My Attendance',                labelBn: 'আমার উপস্থিতি' },
      { view: 'notesheet',     icon: <FileSignature size={16} />,  label: 'My Documents',                 labelBn: 'আমার নথিপত্র' },
      { view: 'claims',        icon: <Receipt size={16} />,        label: 'My TA/DA & Conveyance',        labelBn: 'আমার টিএ/ডিএ ও যাতায়াত',     badge: '৳5.4k', badgeType: 'info' },
    ],
  },
  {
    title: 'Services',
    titleBn: 'সেবাসমূহ',
    items: [
      { view: 'fleet',         icon: <Car size={16} />,            label: 'Request Vehicle',              labelBn: 'গাড়ির অনুরোধ' },
      { view: 'bus',           icon: <Bus size={16} />,            label: 'Bus Seat & Waitlist',          labelBn: 'বাস সিট ও ওয়েটলিস্ট' },
      { view: 'guest',         icon: <Users size={16} />,          label: 'Pre-Register My Guest',        labelBn: 'আমার অতিথি প্রাক-নিবন্ধন' },
      { view: 'parcel',        icon: <Package size={16} />,        label: 'My Parcels',                   labelBn: 'আমার পার্সেল' },
    ],
  },
];

const HR_ADMIN_NAV: NavSection[] = [
  {
    title: 'Workforce & Organization',
    titleBn: 'কর্মশক্তি ও সংস্থা',
    items: [
      { view: 'dashboard',     icon: <LayoutDashboard size={16} />, label: 'HR Executive Dashboard',      labelBn: 'এইচআর ড্যাশবোর্ড' },
      { view: 'workforce',     icon: <Users size={16} />,          label: 'Workforce Master Directory',   labelBn: 'কর্মী মাস্টার ডিরেক্টরি', badge: '11', badgeType: 'info' },
      { view: 'attendance',    icon: <CalendarClock size={16} />,  label: 'Shift Roster & Overtime',      labelBn: 'শিফট রোস্টার ও ওভারটাইম' },
      { view: 'claims',        icon: <Receipt size={16} />,        label: 'Payroll & Travel Claims',      labelBn: 'বেতন ও ভ্রমণ দাবি',         badge: '৳20.2k', badgeType: 'warn' },
    ],
  },
  {
    title: 'Governance & Services',
    titleBn: 'গভর্ন্যান্স ও সেবাসমূহ',
    items: [
      { view: 'notesheet',     icon: <FileSignature size={16} />,  label: 'HR Policy & Note-Sheets',      labelBn: 'এইচআর পলিসি ও নোট-শীট' },
      { view: 'compliance',    icon: <ShieldCheck size={16} />,    label: 'Labor Law & Statutory Audit',  labelBn: 'শ্রম আইন ও বিধিবদ্ধ অডিট' },
      { view: 'inner_circle',  icon: <MessageSquare size={16} />,  label: 'Executive Leadership Comm',    labelBn: 'শীর্ষ নেতৃত্ব যোগাযোগ' },
      { view: 'fleet',         icon: <Car size={16} />,            label: 'Staff Transport Allocation',   labelBn: 'কর্মী যাতায়াত বরাদ্দ' },
    ],
  },
];

const DRIVER_NAV: NavSection[] = [
  {
    title: 'Duty Terminal',
    titleBn: 'ডিউটি টার্মিনাল',
    items: [
      { view: 'fleet',         icon: <Truck size={16} />,          label: 'My Assigned Missions',         labelBn: 'আমার দায়িত্বপ্রাপ্ত ট্রিপ', badge: 'Active', badgeType: 'success' },
      { view: 'attendance',    icon: <MapPin size={16} />,         label: 'Driver Duty & Breathalyzer',   labelBn: 'ডিউটি ও ফিটনেস অডিট' },
      { view: 'claims',        icon: <Receipt size={16} />,        label: 'Toll & Conveyance Slips',      labelBn: 'টোল ও যাতায়াত ভাউচার', badge: '৳1.2k', badgeType: 'info' },
    ],
  },
  {
    title: 'Support & Safety',
    titleBn: 'সহায়তা ও নিরাপত্তা',
    items: [
      { view: 'incident',      icon: <AlertTriangle size={16} />,  label: 'Highway Emergency SOS',        labelBn: 'জরুরি রোডসাইড সহায়তা' },
      { view: 'parcel',        icon: <Package size={16} />,        label: 'Cargo Waybill & Manifest',     labelBn: 'কার্গো চালান ও ডেলিভারি' },
    ],
  },
];

const ROLE_NAV: Record<AppRole, NavSection[]> = {
  chairman: CHAIRMAN_NAV,
  plant_gm: PLANT_GM_NAV,
  transport_admin: TRANSPORT_ADMIN_NAV,
  hr_admin: HR_ADMIN_NAV,
  hod: HOD_NAV,
  employee: EMPLOYEE_NAV,
  driver: DRIVER_NAV,
};

export default function Sidebar({
  role,
  activeView,
  onNavigate,
  lang,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const meta = ROLE_META[role];
  const sections = ROLE_NAV[role];

  return (
    <aside className={`sidebar${isCollapsed ? ' collapsed' : ''}${isMobileOpen ? ' mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-emblem">B</div>
        {!isCollapsed && (
          <div className="brand-text">
            <h1>BASHUNDHARA</h1>
            <p>Oil & Gas Co. Ltd.</p>
          </div>
        )}
        {onToggleCollapse && (
          <button
            className="sidebar-collapse-toggle desktop-collapse-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
        {onCloseMobile && (
          <button
            className="sidebar-mobile-close"
            onClick={onCloseMobile}
            title="Close navigation menu"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Role Badge */}
      {!isCollapsed ? (
        <div className="role-badge">
          <div className="role-badge-dot" />
          <div className="role-badge-text">
            <div className="label">{t('Active Role', 'সক্রিয় ভূমিকা', lang)}</div>
            <div className="value">{t(meta.label, meta.labelBn, lang)}</div>
          </div>
        </div>
      ) : (
        <div className="role-badge-mini" title={`${t('Active Role', 'সক্রিয় ভূমিকা', lang)}: ${meta.name}`}>
          <div className="role-badge-dot" />
        </div>
      )}

      {/* Role-Specific Navigation */}
      <nav className="sidebar-nav">
        {sections.map((section, si) => (
          <React.Fragment key={si}>
            {!isCollapsed && (
              <div className="nav-section">{t(section.title, section.titleBn, lang)}</div>
            )}
            {section.items.map(item => {
              const isActive = activeView === item.view;
              return (
                <a
                  key={item.view + '-' + si}
                  className={`nav-link${isActive ? ' active' : ''}${isCollapsed ? ' collapsed' : ''}`}
                  onClick={() => {
                    onNavigate(item.view);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  title={isCollapsed ? t(item.label, item.labelBn, lang) : undefined}
                >
                  <div className="nav-icon-wrap">{item.icon}</div>
                  {!isCollapsed && <span className="nav-label">{t(item.label, item.labelBn, lang)}</span>}
                  {item.badge && (
                    <span className={`nav-badge${item.badgeType === 'warn' ? ' warn' : ''}${item.badgeType === 'info' ? ' info' : ''}${isCollapsed ? ' badge-dot' : ''}`}>
                      {!isCollapsed ? item.badge : ''}
                    </span>
                  )}
                  {isActive && <span className="nav-active-glow" />}
                </a>
              );
            })}
          </React.Fragment>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!isCollapsed ? (
          <div className="sidebar-footer-content">
            <div className="footer-status-row">
              <div className="online-dot" />
              <span>{t('Keraniganj DCS Node: Online', 'কেরানীগঞ্জ ডিসিএস: অনলাইন', lang)}</span>
            </div>
            <div className="footer-version-row">
              <span className="badge-version">v2.4.0-Enterprise</span>
              <span className="latency-text">12ms latency</span>
            </div>
          </div>
        ) : (
          <div className="online-dot" title="Keraniganj DCS Node: Online (12ms)" />
        )}
      </div>
    </aside>
  );
}
