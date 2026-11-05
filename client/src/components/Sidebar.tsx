import React from 'react';
import { AppRole, AppView, Lang, ROLE_META, t } from '../types';
import {
  LayoutDashboard, FileSignature, ShieldCheck, Truck, Bus,
  Package, MapPin, AlertTriangle, ChevronLeft, ChevronRight,
  MessageSquare, Gauge, ClipboardCheck, Users,
  Wrench, CalendarClock, UserCheck, Receipt, Car,
  Briefcase, BarChart3, X
} from 'lucide-react';
import { useApprovalStore } from '../store/approvalStore';
import { useMyApprovalQueue } from '../views/approvals/config';
import { useNotesheetStore } from '../store/notesheetStore';
import { useOperationsStore } from '../store/operationsStore';
import { useFleetStore } from '../store/fleetStore';
import { useAssetStore } from '../store/assetStore';
import { useBusStore } from '../store/busStore';
import { useEmployeeStore } from '../store/employeeStore';
import { canAccessView, type Permission } from '../auth/permissions';
import { useCurrentUser } from '../auth/session';
import { fleetModeFor, driverRecordFor } from '../views/fleet/config';
import { guestModeFor, visitorsVisibleTo } from '../views/guest/config';
import { incidentModeFor, incidentsVisibleTo } from '../views/incident/config';
import { isMine as isMyClaim, isPending as isPendingClaim } from '../views/claims/config';

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
}

interface NavSection {
  title: string;
  titleBn: string;
  items: NavEntry[];
}

/* ────────────────────────────────────────────
   Clear, Role-Tailored Navigation Menus
   ──────────────────────────────────────────── */

const CHAIRMAN_NAV: NavSection[] = [
  {
    title: 'Leadership & Approvals',
    titleBn: 'নেতৃত্ব ও অনুমোদন',
    items: [
      { view: 'dashboard',    icon: <LayoutDashboard size={16} />, label: 'Executive Overview',    labelBn: 'এক্সিকিউটিভ ড্যাশবোর্ড' },
      { view: 'inner_circle', icon: <MessageSquare size={16} />,  label: 'Leadership Messages',   labelBn: 'নেতৃত্বের বার্তালাপ' },
      { view: 'approvals',    icon: <ClipboardCheck size={16} />, label: 'Pending Approvals',     labelBn: 'অপেক্ষমাণ অনুমোদন' },
      { view: 'notesheet',    icon: <FileSignature size={16} />,  label: 'Official Documents',    labelBn: 'দাপ্তরিক নথিপত্র' },
    ],
  },
  {
    title: 'Company Oversight',
    titleBn: 'প্রতিষ্ঠান তত্ত্বাবধান',
    items: [
      { view: 'asset',        icon: <Wrench size={16} />,         label: 'Assets & Equipment',    labelBn: 'সম্পদ ও যন্ত্রপাতি' },
      { view: 'compliance',   icon: <ShieldCheck size={16} />,    label: 'Permits & Licenses',    labelBn: 'লাইসেন্স ও অনুমোদনপত্র' },
      { view: 'guest',        icon: <Users size={16} />,          label: 'Visitor Gate Passes',   labelBn: 'অতিথি ও পরিদর্শক পাস' },
      { view: 'incident',     icon: <AlertTriangle size={16} />,  label: 'Safety & Incidents',    labelBn: 'নিরাপত্তা ও দুর্ঘটনা রিপোর্ট' },
      { view: 'attendance',   icon: <BarChart3 size={16} />,      label: 'Staff Attendance',      labelBn: 'কর্মী উপস্থিতি' },
      { view: 'workforce',    icon: <Users size={16} />,          label: 'Staff Directory',       labelBn: 'কর্মী তালিকা ও ছাড়পত্র' },
    ],
  },
];

const PLANT_GM_NAV: NavSection[] = [
  {
    title: 'Plant Operations',
    titleBn: 'প্ল্যান্ট পরিচালনা',
    items: [
      { view: 'dashboard',    icon: <Gauge size={16} />,          label: 'Plant Overview',        labelBn: 'প্ল্যান্ট ড্যাশবোর্ড' },
      { view: 'approvals',    icon: <ClipboardCheck size={16} />, label: 'Pending Approvals',     labelBn: 'অপেক্ষমাণ অনুমোদন' },
      { view: 'asset',        icon: <Wrench size={16} />,         label: 'Machinery & Assets',    labelBn: 'প্ল্যান্ট যন্ত্রপাতি ও সম্পদ' },
      { view: 'notesheet',    icon: <FileSignature size={16} />,  label: 'Official Documents',    labelBn: 'দাপ্তরিক নথিপত্র' },
      { view: 'incident',     icon: <AlertTriangle size={16} />,  label: 'Safety & Incidents',    labelBn: 'প্ল্যান্ট নিরাপত্তা ও ঘটনা' },
    ],
  },
  {
    title: 'Administration & Staff',
    titleBn: 'প্রশাসন ও কর্মী',
    items: [
      { view: 'inner_circle', icon: <MessageSquare size={16} />,  label: 'Leadership Messages',   labelBn: 'নেতৃত্বের বার্তালাপ' },
      { view: 'compliance',   icon: <ShieldCheck size={16} />,    label: 'Plant Permits',         labelBn: 'প্ল্যান্ট লাইসেন্স নবায়ন' },
      { view: 'guest',        icon: <Users size={16} />,          label: 'Visitors & Inspectors', labelBn: 'পরিদর্শক ও অতিথি পাস' },
      { view: 'attendance',   icon: <CalendarClock size={16} />,  label: 'Shift Attendance',      labelBn: 'শিফট উপস্থিতি ও ছুটি' },
      { view: 'parcel',       icon: <Package size={16} />,        label: 'Samples & Parcels',     labelBn: 'নমুনা ও পার্সেল ট্র্যাকিং' },
    ],
  },
];

const TRANSPORT_ADMIN_NAV: NavSection[] = [
  {
    title: 'Vehicles & Buses',
    titleBn: 'যানবাহন ও বাস ব্যবস্থাপনা',
    items: [
      { view: 'dashboard',    icon: <Truck size={16} />,          label: 'Transport Overview',    labelBn: 'পরিবহন ড্যাশবোর্ড' },
      { view: 'fleet',        icon: <Car size={16} />,            label: 'Vehicles & Trips',      labelBn: 'গাড়ি বরাদ্দ ও ট্রিপ' },
      { view: 'bus',          icon: <Bus size={16} />,            label: 'Staff Shuttle Buses',   labelBn: 'স্টাফ বাস ও সিট তালিকা' },
      { view: 'asset',        icon: <Wrench size={16} />,         label: 'Vehicle Asset Records', labelBn: 'যানবাহন সম্পদ খতিয়ান' },
    ],
  },
  {
    title: 'Gate & Office Support',
    titleBn: 'গেট ও অফিস প্রশাসন',
    items: [
      { view: 'guest',        icon: <Users size={16} />,          label: 'Visitor Gate Passes',   labelBn: 'অতিথি গেট পাস' },
      { view: 'parcel',       icon: <Package size={16} />,        label: 'Office Mail & Parcels', labelBn: 'অফিস পার্সেল ও চিঠিপত্র' },
      { view: 'incident',     icon: <AlertTriangle size={16} />,  label: 'Road & Safety Reports', labelBn: 'সড়ক ও নিরাপত্তা রিপোর্ট' },
      { view: 'claims',       icon: <Receipt size={16} />,        label: 'Expense & Event Bills', labelBn: 'ব্যয় ও ইভেন্ট বিল' },
      { view: 'attendance',   icon: <MapPin size={16} />,         label: 'Staff Attendance',      labelBn: 'কর্মী উপস্থিতি' },
      { view: 'notesheet',    icon: <FileSignature size={16} />,  label: 'Official Documents',    labelBn: 'প্রশাসনিক নথিপত্র' },
    ],
  },
];

const HOD_NAV: NavSection[] = [
  {
    title: 'Department & Approvals',
    titleBn: 'বিভাগ ও অনুমোদন',
    items: [
      { view: 'dashboard',    icon: <Briefcase size={16} />,      label: 'Department Overview',   labelBn: 'বিভাগীয় ড্যাশবোর্ড' },
      { view: 'approvals',    icon: <ClipboardCheck size={16} />, label: 'Pending Approvals',     labelBn: 'অপেক্ষমাণ অনুমোদন' },
      { view: 'notesheet',    icon: <FileSignature size={16} />,  label: 'Official Documents',    labelBn: 'দাপ্তরিক নথিপত্র ও স্বাক্ষর' },
      { view: 'inner_circle', icon: <MessageSquare size={16} />,  label: 'Leadership Messages',   labelBn: 'নেতৃত্বের বার্তালাপ' },
      { view: 'compliance',   icon: <ShieldCheck size={16} />,    label: 'Permits & Licenses',    labelBn: 'লাইসেন্স ও কমপ্লায়েন্স' },
    ],
  },
  {
    title: 'Finance, Assets & Team',
    titleBn: 'অর্থ, সম্পদ ও কর্মী দল',
    items: [
      { view: 'claims',       icon: <Receipt size={16} />,        label: 'Expense & Travel Claims', labelBn: 'ভ্রমণ ও যাতায়াত বিল' },
      { view: 'asset',        icon: <Wrench size={16} />,         label: 'Assets & Book Value',   labelBn: 'স্থায়ী সম্পদ ও মূল্য হিসাব' },
      { view: 'attendance',   icon: <UserCheck size={16} />,      label: 'Team Attendance & Leave', labelBn: 'দলীয় উপস্থিতি ও ছুটি' },
      { view: 'workforce',    icon: <Users size={16} />,          label: 'Staff Directory',       labelBn: 'কর্মী তালিকা ও ছাড়পত্র' },
      { view: 'fleet',        icon: <Car size={16} />,            label: 'Company Car Bookings',  labelBn: 'অফিসিয়াল গাড়ি বুকিং' },
      { view: 'guest',        icon: <Users size={16} />,          label: 'Visitor Gate Passes',   labelBn: 'অতিথি গেট পাস' },
      { view: 'parcel',       icon: <Package size={16} />,        label: 'Office Mail & Parcels', labelBn: 'অফিস পার্সেল' },
      { view: 'incident',     icon: <AlertTriangle size={16} />,  label: 'Safety & Incidents',    labelBn: 'নিরাপত্তা রিপোর্ট' },
    ],
  },
];

const HR_ADMIN_NAV: NavSection[] = [
  {
    title: 'HR & Staff Management',
    titleBn: 'মানবসম্পদ ও কর্মী ব্যবস্থাপনা',
    items: [
      { view: 'dashboard',    icon: <LayoutDashboard size={16} />, label: 'HR Overview',          labelBn: 'এইচআর ড্যাশবোর্ড' },
      { view: 'workforce',    icon: <Users size={16} />,          label: 'Staff Directory & Exit', labelBn: 'কর্মী তালিকা ও ছাড়পত্র' },
      { view: 'approvals',    icon: <ClipboardCheck size={16} />, label: 'Pending Approvals',     labelBn: 'অপেক্ষমাণ অনুমোদন' },
      { view: 'attendance',   icon: <CalendarClock size={16} />,  label: 'Attendance & Leave',    labelBn: 'উপস্থিতি ও ছুটি ব্যবস্থাপনা' },
      { view: 'claims',       icon: <Receipt size={16} />,        label: 'Staff Expense Claims',  labelBn: 'কর্মী ভ্রমণ ও ব্যয় বিল' },
    ],
  },
  {
    title: 'Office & Administration',
    titleBn: 'অফিস ও প্রশাসন সেবা',
    items: [
      { view: 'asset',        icon: <Wrench size={16} />,         label: 'Staff Assets & Store',  labelBn: 'কর্মী সম্পদ ও স্টোর' },
      { view: 'notesheet',    icon: <FileSignature size={16} />,  label: 'HR Policies & Files',   labelBn: 'এইচআর পলিসি ও নথিপত্র' },
      { view: 'bus',          icon: <Bus size={16} />,            label: 'Staff Shuttle Buses',   labelBn: 'স্টাফ বাস ও সিট বরাদ্দ' },
      { view: 'fleet',        icon: <Car size={16} />,            label: 'Company Car Bookings',  labelBn: 'গাড়ি বুকিং ও বরাদ্দ' },
      { view: 'guest',        icon: <Users size={16} />,          label: 'Visitor Gate Passes',   labelBn: 'অতিথি গেট পাস' },
      { view: 'parcel',       icon: <Package size={16} />,        label: 'Office Mail & Parcels', labelBn: 'অফিস পার্সেল' },
      { view: 'compliance',   icon: <ShieldCheck size={16} />,    label: 'Permits & Labor Rules', labelBn: 'লাইসেন্স ও শ্রম বিধি' },
      { view: 'incident',     icon: <AlertTriangle size={16} />,  label: 'Safety & Incidents',    labelBn: 'নিরাপত্তা রিপোর্ট' },
      { view: 'inner_circle', icon: <MessageSquare size={16} />,  label: 'Leadership Messages',   labelBn: 'নেতৃত্বের বার্তালাপ' },
    ],
  },
];

const EMPLOYEE_NAV: NavSection[] = [
  {
    title: 'My Daily Work',
    titleBn: 'আমার দৈনন্দিন কাজ',
    items: [
      { view: 'dashboard',    icon: <LayoutDashboard size={16} />, label: 'My Workspace',         labelBn: 'আমার ড্যাশবোর্ড' },
      { view: 'attendance',   icon: <MapPin size={16} />,         label: 'My Attendance & Leave', labelBn: 'আমার উপস্থিতি ও ছুটি' },
      { view: 'notesheet',    icon: <FileSignature size={16} />,  label: 'My Documents',          labelBn: 'আমার নথিপত্র' },
      { view: 'claims',       icon: <Receipt size={16} />,        label: 'My Expense Claims',     labelBn: 'আমার ভ্রমণ ও যাতায়াত বিল' },
    ],
  },
  {
    title: 'Office Services',
    titleBn: 'অফিস সেবাসমূহ',
    items: [
      { view: 'asset',        icon: <Wrench size={16} />,         label: 'My Assigned Equipment', labelBn: 'আমার বরাদ্দকৃত সরঞ্জাম' },
      { view: 'fleet',        icon: <Car size={16} />,            label: 'Book Company Car',      labelBn: 'অফিসিয়াল গাড়ি বুকিং' },
      { view: 'bus',          icon: <Bus size={16} />,            label: 'Staff Shuttle Bus',     labelBn: 'স্টাফ বাস সিট ও রুট' },
      { view: 'guest',        icon: <Users size={16} />,          label: 'Invite a Visitor',      labelBn: 'অতিথি গেট পাস আবেদন' },
      { view: 'parcel',       icon: <Package size={16} />,        label: 'My Parcels',            labelBn: 'আমার পার্সেল' },
      { view: 'incident',     icon: <AlertTriangle size={16} />,  label: 'Report Safety Issue',   labelBn: 'নিরাপত্তা সমস্যা জানান' },
    ],
  },
];

const DRIVER_NAV: NavSection[] = [
  {
    title: 'Driver Duty',
    titleBn: 'ড্রাইভার ডিউটি',
    items: [
      { view: 'dashboard',    icon: <Gauge size={16} />,          label: 'Driver Home',           labelBn: 'ড্রাইভার ড্যাশবোর্ড' },
      { view: 'fleet',        icon: <Truck size={16} />,          label: 'My Assigned Trips',     labelBn: 'আমার নির্ধারিত ট্রিপ' },
      { view: 'attendance',   icon: <MapPin size={16} />,         label: 'Duty Check-In',         labelBn: 'ডিউটি উপস্থিতি' },
      { view: 'claims',       icon: <Receipt size={16} />,        label: 'Toll & Fuel Slips',     labelBn: 'টোল ও যাতায়াত স্লিপ' },
    ],
  },
  {
    title: 'Safety & Delivery',
    titleBn: 'নিরাপত্তা ও ডেলিভারি',
    items: [
      { view: 'asset',        icon: <Wrench size={16} />,         label: 'My Assigned Vehicle',   labelBn: 'আমার দায়িত্বপ্রাপ্ত গাড়ি' },
      { view: 'parcel',       icon: <Package size={16} />,        label: 'Parcels to Deliver',    labelBn: 'পার্সেল ডেলিভারি তালিকা' },
      { view: 'incident',     icon: <AlertTriangle size={16} />,  label: 'Report Road Incident',  labelBn: 'সড়ক সমস্যা বা জরুরি সহায়তা' },
    ],
  },
];

export const ROLE_NAV: Record<AppRole, NavSection[]> = {
  chairman: CHAIRMAN_NAV,
  plant_gm: PLANT_GM_NAV,
  transport_admin: TRANSPORT_ADMIN_NAV,
  hr_admin: HR_ADMIN_NAV,
  hod: HOD_NAV,
  employee: EMPLOYEE_NAV,
  driver: DRIVER_NAV,
};


export function useLiveNavBadges(_role: AppRole): Record<string, { text: string; type: 'danger' | 'warn' | 'info' }> {
  const user = useCurrentUser();
  const { claims } = useApprovalStore();
  const { pending: approvalItems } = useMyApprovalQueue();
  const { files } = useNotesheetStore();
  const { licenses, incidents, visitors, chatChannels, chatMembers } = useOperationsStore();
  const { requisitions, driverTollSlips, drivers } = useFleetStore();
  const { assets } = useAssetStore();
  const { waitlist } = useBusStore();
  const { activeEmployees } = useEmployeeStore();

  const badges: Record<string, { text: string; type: 'danger' | 'warn' | 'info' }> = {};
  if (!user) return badges;
  const can = (p: Permission) => user.permissions.has(p);

  if (approvalItems.length > 0) {
    badges.approvals = { text: String(approvalItems.length), type: 'danger' };
  }

  const pendingDocs = files.filter(
    (f) => f.status !== 'approved' && (can('notesheet:view_all') || f.initiatorName === user.name)
  ).length;
  if (pendingDocs > 0) {
    badges.notesheet = { text: String(pendingDocs), type: 'warn' };
  }

  if (can('chat:leadership')) {
    const unreadChat =
      chatChannels.reduce((acc, c) => acc + (c.unread || 0), 0) +
      (can('chat:directive') ? chatMembers.reduce((acc, m) => acc + (m.unread || 0), 0) : 0);
    if (unreadChat > 0) {
      badges.inner_circle = { text: String(unreadChat), type: 'info' };
    }
  }

  if (can('compliance:view')) {
    const expiringPermits = licenses.filter((l) => l.stage < 5 && l.daysLeft <= 90).length;
    if (expiringPermits > 0) {
      badges.compliance = { text: String(expiringPermits), type: 'warn' };
    }
  }

  const openIncidents = incidentsVisibleTo(user, incidentModeFor(user), incidents).filter((i) => i.capaStatus !== 'closed').length;
  if (openIncidents > 0) {
    badges.incident = { text: String(openIncidents), type: can('incident:view_all') ? 'danger' : 'info' };
  }

  const insideVisitors = visitorsVisibleTo(user, guestModeFor(user), visitors, 'all').filter((v) => v.status === 'checked_in').length;
  if (insideVisitors > 0) {
    badges.guest = { text: `${insideVisitors}`, type: 'info' };
  }

  const fleetMode = fleetModeFor(user);
  const myDriver = fleetMode === 'driver' ? driverRecordFor(user, drivers) : undefined;
  if (myDriver) {
    const activeDriverTrips = requisitions.filter(
      (r) => r.assignedDriverId === myDriver.id && (r.status === 'assigned' || r.status === 'in_transit')
    ).length;
    if (activeDriverTrips > 0) {
      badges.fleet = { text: String(activeDriverTrips), type: 'warn' };
    }
  } else if (fleetMode === 'dispatch') {
    const pendingTrips = requisitions.filter((r) => r.status === 'pending').length;
    if (pendingTrips > 0) {
      badges.fleet = { text: String(pendingTrips), type: 'warn' };
    }
  }

  if (waitlist.length > 0 && can('bus:manage')) {
    badges.bus = { text: `${waitlist.length} Wait`, type: 'info' };
  }

  if (activeEmployees.length > 0 && can('workforce:view')) {
    badges.workforce = { text: String(activeEmployees.length), type: 'info' };
  }

  if (myDriver) {
    const pendingTolls = driverTollSlips.filter((s) => s.status === 'Pending Review').length;
    if (pendingTolls > 0) {
      badges.claims = { text: String(pendingTolls), type: 'info' };
    }
  } else if (can('claims:view_all')) {
    const allPendingClaims = claims.filter(isPendingClaim).length;
    if (allPendingClaims > 0) {
      badges.claims = { text: String(allPendingClaims), type: 'warn' };
    }
  } else {
    const myPendingClaims = claims.filter((c) => isMyClaim(c, user) && isPendingClaim(c)).length;

    if (myPendingClaims > 0) {
      badges.claims = { text: String(myPendingClaims), type: 'info' };
    }
  }

  if (!can('asset:view_all')) {
    const unconfirmed = assets.filter((a) => a.custodianEmpId === user.empId && !a.custodianAcknowledged).length;
    if (unconfirmed > 0) {
      badges.asset = { text: `${unconfirmed} Confirm`, type: 'warn' };
    }
  } else if (can('asset:manage')) {
    const dueMaint = assets.filter((a) => a.lifecycleStage === 'calibration_due' || a.lifecycleStage === 'maintenance').length;
    if (dueMaint > 0) {
      badges.asset = { text: `${dueMaint} Due`, type: 'warn' };
    }
  } else if (can('asset:approve_disposal')) {
    const retirePending = assets.filter((a) => a.lifecycleStage === 'decommissioned').length;
    if (retirePending > 0) {
      badges.asset = { text: `${retirePending} Review`, type: 'warn' };
    }
  }

  return badges;
}

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
  // Nav is the role's curated menu, filtered once more by the permission matrix
  // so a menu entry can never expose a view the role cannot open.
  const sections = ROLE_NAV[role]
    .map((s) => ({ ...s, items: s.items.filter((i) => canAccessView(role, i.view)) }))
    .filter((s) => s.items.length > 0);

  const normalizedActiveView: AppView = activeView === 'vehicle_request' ? 'fleet' : activeView;

  return (
    <aside className={`sidebar${isCollapsed ? ' collapsed' : ''}${isMobileOpen ? ' mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-emblem">
          <img src="/logoBOGCL.png" alt="BOGCL Logo" />
        </div>
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

      {/* Role-Specific Navigation */}
      <nav className="sidebar-nav">
        {sections.map((section, si) => (
          <React.Fragment key={si}>
            {!isCollapsed && (
              <div className="nav-section">{t(section.title, section.titleBn, lang)}</div>
            )}
            {section.items.map((item) => {
              const isActive = normalizedActiveView === item.view;
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
                  {isActive && <span className="nav-active-glow" />}
                </a>
              );
            })}
          </React.Fragment>
        ))}
      </nav>
    </aside>
  );
}
