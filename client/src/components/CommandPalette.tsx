import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppRole, AppView, Lang, ROLE_META, t } from '../types';
import {
  Search, LayoutDashboard, FileSignature, ShieldCheck, Truck, Bus,
  Package, MapPin, AlertTriangle, CornerDownLeft, Moon, Sun, Users,
  ClipboardCheck, Wrench, Receipt, MessageSquare
} from 'lucide-react';
import { getAllowedViewsForRole } from './Sidebar';
import { useNotesheetStore } from '../store/notesheetStore';
import { useFleetStore } from '../store/fleetStore';
import { useAssetStore } from '../store/assetStore';
import { useOperationsStore } from '../store/operationsStore';
import { useEmployeeStore } from '../store/employeeStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
  onRoleChange?: (role: AppRole) => void;
  onToggleTheme: () => void;
  lang: Lang;
  currentTheme: 'light' | 'dark';
  role?: AppRole;
}

interface CommandItem {
  id: string;
  title: string;
  titleBn: string;
  category: 'Pages' | 'Live Records' | 'Quick Settings' | 'Switch Role (Preview)';
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

const ALL_VIEW_COMMANDS: Array<{
  view: AppView;
  title: string;
  titleBn: string;
  icon: React.ReactNode;
}> = [
  { view: 'dashboard',    title: 'Workspace Overview (Home Dashboard)',    titleBn: 'ওয়ার্কস্পেস ড্যাশবোর্ড',         icon: <LayoutDashboard size={15} /> },
  { view: 'approvals',    title: 'Pending Approvals Center',               titleBn: 'অপেক্ষমাণ অনুমোদন কেন্দ্র',       icon: <ClipboardCheck size={15} /> },
  { view: 'notesheet',    title: 'Official Documents & Signatures',        titleBn: 'দাপ্তরিক নথিপত্র ও স্বাক্ষর',      icon: <FileSignature size={15} /> },
  { view: 'inner_circle', title: 'Leadership Messages',                    titleBn: 'নেতৃত্বের বার্তালাপ',             icon: <MessageSquare size={15} /> },
  { view: 'asset',        title: 'Company Assets & Equipment',             titleBn: 'কোম্পানির সম্পদ ও যন্ত্রপাতি',    icon: <Wrench size={15} /> },
  { view: 'fleet',        title: 'Company Vehicles & Car Bookings',        titleBn: 'অফিসিয়াল গাড়ি ও ট্রিপ বুকিং',    icon: <Truck size={15} /> },
  { view: 'bus',          title: 'Staff Shuttle Buses & Seats',            titleBn: 'স্টাফ বাস রুট ও সিট তালিকা',     icon: <Bus size={15} /> },
  { view: 'claims',       title: 'Expense & Travel Claims',                titleBn: 'ভ্রমণ ও যাতায়াত ব্যয় বিল',      icon: <Receipt size={15} /> },
  { view: 'attendance',   title: 'Daily Attendance & Leave',               titleBn: 'দৈনন্দিন উপস্থিতি ও ছুটি',       icon: <MapPin size={15} /> },
  { view: 'workforce',    title: 'Staff Directory & Exit Clearance',       titleBn: 'কর্মী তালিকা ও বিদায় ছাড়পত্র',   icon: <Users size={15} /> },
  { view: 'compliance',   title: 'Permits & License Renewals',             titleBn: 'লাইসেন্স ও অনুমোদন নবায়ন',       icon: <ShieldCheck size={15} /> },
  { view: 'guest',        title: 'Visitor Gate Passes',                    titleBn: 'অতিথি ও পরিদর্শক গেট পাস',       icon: <Users size={15} /> },
  { view: 'parcel',       title: 'Office Mail & Parcel Tracker',           titleBn: 'অফিস পার্সেল ট্র্যাকার',         icon: <Package size={15} /> },
  { view: 'incident',     title: 'Safety & Incident Reports',              titleBn: 'নিরাপত্তা ও দুর্ঘটনা রিপোর্ট',    icon: <AlertTriangle size={15} /> },
];

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onRoleChange,
  onToggleTheme,
  lang,
  currentTheme,
  role = 'chairman',
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { files } = useNotesheetStore();
  const { vehicles, requisitions } = useFleetStore();
  const { assets } = useAssetStore();
  const { licenses } = useOperationsStore();
  const { activeEmployees } = useEmployeeStore();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const allowedViews = useMemo(() => getAllowedViewsForRole(role), [role]);
  const meta = ROLE_META[role];

  const items: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [];

    // 1. Permitted Pages
    ALL_VIEW_COMMANDS.filter((v) => allowedViews.has(v.view)).forEach((v) => {
      list.push({
        id: `view-${v.view}`,
        title: v.title,
        titleBn: v.titleBn,
        category: 'Pages',
        icon: v.icon,
        action: () => {
          onNavigate(v.view);
          onClose();
        },
      });
    });

    // 2. Live Records (Scoped to Role Permissions)
    if (allowedViews.has('notesheet')) {
      const visibleFiles =
        role === 'employee'
          ? files.filter((f) => f.initiatorName === meta.name)
          : files;
      visibleFiles.slice(0, 4).forEach((f) => {
        list.push({
          id: `doc-${f.id}`,
          title: `${f.fileNo}: ${f.title} (${f.amount})`,
          titleBn: `${f.fileNo}: ${f.title}`,
          category: 'Live Records',
          icon: <FileSignature size={15} color="#A51C30" />,
          action: () => {
            onNavigate('notesheet');
            onClose();
          },
        });
      });
    }

    if (allowedViews.has('asset')) {
      const visibleAssets =
        role === 'employee' || role === 'driver'
          ? assets.filter((a) => a.custodianEmpId === meta.empId)
          : assets.slice(0, 4);
      visibleAssets.forEach((a) => {
        list.push({
          id: `ast-${a.id}`,
          title: `${a.tag}: ${a.name}`,
          titleBn: `${a.tag}: ${a.name}`,
          category: 'Live Records',
          icon: <Wrench size={15} color="#0369A1" />,
          action: () => {
            onNavigate('asset');
            onClose();
          },
        });
      });
    }

    if (allowedViews.has('fleet')) {
      if (role === 'employee') {
        requisitions
          .filter((r) => r.requesterName === meta.name)
          .forEach((r) => {
            list.push({
              id: `req-${r.id}`,
              title: `${r.id}: Car Booking — ${r.from} to ${r.to}`,
              titleBn: `${r.id}: গাড়ির আবেদন — ${r.from} হতে ${r.to}`,
              category: 'Live Records',
              icon: <Truck size={15} color="#059669" />,
              action: () => {
                onNavigate('fleet');
                onClose();
              },
            });
          });
      } else if (role === 'driver') {
        requisitions
          .filter((r) => r.assignedDriverId === 'DRV-01')
          .forEach((r) => {
            list.push({
              id: `drv-req-${r.id}`,
              title: `${r.id}: Assigned Trip — ${r.from} to ${r.to}`,
              titleBn: `${r.id}: নির্ধারিত ট্রিপ — ${r.from} হতে ${r.to}`,
              category: 'Live Records',
              icon: <Truck size={15} color="#059669" />,
              action: () => {
                onNavigate('fleet');
                onClose();
              },
            });
          });
      } else {
        vehicles.slice(0, 3).forEach((v) => {
          list.push({
            id: `veh-${v.id}`,
            title: `${v.plate}: ${v.model} (${v.driverName || 'Standby Pool'})`,
            titleBn: `${v.plate}: ${v.model}`,
            category: 'Live Records',
            icon: <Truck size={15} color="#0369A1" />,
            action: () => {
              onNavigate('fleet');
              onClose();
            },
          });
        });
      }
    }

    if (allowedViews.has('compliance')) {
      licenses.slice(0, 3).forEach((l) => {
        list.push({
          id: `lic-${l.id}`,
          title: `${l.refNo}: ${l.title} (${l.daysLeft} days left)`,
          titleBn: `${l.refNo}: ${l.titleBn}`,
          category: 'Live Records',
          icon: <ShieldCheck size={15} color="#D97706" />,
          action: () => {
            onNavigate('compliance');
            onClose();
          },
        });
      });
    }

    if (allowedViews.has('workforce')) {
      activeEmployees.slice(0, 4).forEach((emp) => {
        list.push({
          id: `emp-${emp.id}`,
          title: `${emp.name} (${emp.id}) — ${emp.designation}`,
          titleBn: `${emp.nameBn || emp.name} (${emp.id})`,
          category: 'Live Records',
          icon: <Users size={15} color="#7C3AED" />,
          action: () => {
            onNavigate('workforce');
            onClose();
          },
        });
      });
    }

    // 3. Quick Settings
    list.push({
      id: 'act-theme',
      title: `Switch to ${currentTheme === 'light' ? 'Dark' : 'Light'} Mode`,
      titleBn: currentTheme === 'light' ? 'ডার্ক মোড চালু করুন' : 'লাইট মোড চালু করুন',
      category: 'Quick Settings',
      icon: currentTheme === 'light' ? <Moon size={15} /> : <Sun size={15} />,
      action: () => {
        onToggleTheme();
        onClose();
      },
    });

    // 4. Switch Role (Preview)
    if (onRoleChange) {
      (Object.keys(ROLE_META) as AppRole[]).forEach((r) => {
        const rMeta = ROLE_META[r];
        list.push({
          id: `switch-role-${r}`,
          title: `Switch Role: ${rMeta.name} (${rMeta.label})`,
          titleBn: `পদবি পরিবর্তন: ${rMeta.nameBn} (${rMeta.labelBn})`,
          category: 'Switch Role (Preview)',
          icon: <Users size={15} color={rMeta.avatarColor} />,
          action: () => {
            onRoleChange(r);
            onClose();
          },
          shortcut: rMeta.empId,
        });
      });
    }

    return list;
  }, [
    allowedViews,
    role,
    meta,
    files,
    assets,
    vehicles,
    requisitions,
    licenses,
    activeEmployees,
    currentTheme,
    onNavigate,
    onToggleTheme,
    onRoleChange,
    onClose,
  ]);

  const filteredItems = items.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.titleBn.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.shortcut && item.shortcut.toLowerCase().includes(q))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div className="command-palette-modal" onClick={(e) => e.stopPropagation()}>
        {/* Search Input Box */}
        <div className="palette-input-wrap">
          <Search size={18} className="palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t(
              'Search pages, document numbers, assets, vehicles, or staff...',
              'পেইজ, ফাইল নম্বর, সম্পদ, গাড়ি বা কর্মীর নাম খুঁজুন...',
              lang
            )}
          />
          <div className="palette-esc-badge">ESC</div>
        </div>

        {/* Results List */}
        <div className="palette-list" ref={listRef}>
          {filteredItems.length === 0 ? (
            <div className="palette-empty">
              <span>{t('No matching pages or records found.', 'কোনো ফলাফল পাওয়া যায়নি।', lang)}</span>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`palette-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="palette-item-left">
                    <div className="palette-item-icon">{item.icon}</div>
                    <div className="palette-item-content">
                      <div className="palette-item-title">{t(item.title, item.titleBn, lang)}</div>
                      <div className="palette-item-sub">{item.category}</div>
                    </div>
                  </div>

                  <div className="palette-item-right">
                    {item.shortcut && <span className="palette-shortcut">{item.shortcut}</span>}
                    {isSelected && <CornerDownLeft size={13} className="palette-select-icon" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Palette Footer */}
        <div className="palette-footer">
          <div className="palette-footer-hint">
            <span><kbd>↑</kbd> <kbd>↓</kbd> {t('Move', 'নেভিগেট', lang)}</span>
            <span><kbd>↵</kbd> {t('Open', 'নির্বাচন', lang)}</span>
            <span><kbd>esc</kbd> {t('Close', 'বন্ধ', lang)}</span>
          </div>
          <div className="palette-footer-badge">
            {t(`BOGCL Quick Search • ${meta.label}`, `দ্রুত অনুসন্ধান • ${meta.labelBn}`, lang)}
          </div>
        </div>
      </div>
    </div>
  );
}
