import React, { useState, useEffect, useRef } from 'react';
import { AppRole, AppView, Lang, t } from '../types';
import {
  Search, LayoutDashboard, FileSignature, ShieldCheck, Truck, Bus,
  Package, MapPin, AlertTriangle, ArrowRight, CornerDownLeft, Shield, Moon, Sun, Lock, Users
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
  onRoleChange: (role: AppRole) => void;
  onToggleTheme: () => void;
  lang: Lang;
  currentTheme: 'light' | 'dark';
}

interface CommandItem {
  id: string;
  title: string;
  titleBn: string;
  category: 'Views' | 'Quick Actions' | 'Records & Assets' | 'Security';
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onRoleChange,
  onToggleTheme,
  lang,
  currentTheme,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // All actionable commands and records
  const items: CommandItem[] = [
    // Views
    {
      id: 'view-dashboard',
      title: 'Executive Cockpit',
      titleBn: 'এক্সিকিউটিভ কক্পিট',
      category: 'Views',
      icon: <LayoutDashboard size={15} />,
      action: () => { onNavigate('dashboard'); onClose(); },
    },
    {
      id: 'view-notesheet',
      title: 'Note-Sheet & Cryptographic E-Sign',
      titleBn: 'নোট-শিট ও ই-স্বাক্ষর',
      category: 'Views',
      icon: <FileSignature size={15} />,
      action: () => { onNavigate('notesheet'); onClose(); },
    },
    {
      id: 'view-compliance',
      title: 'BSTI & Statutory License Pipeline',
      titleBn: 'বিএসটিআই লাইসেন্স পাইপলাইন',
      category: 'Views',
      icon: <ShieldCheck size={15} />,
      action: () => { onNavigate('compliance'); onClose(); },
    },
    {
      id: 'view-fleet',
      title: 'Fleet Logistics & Ride Pooling',
      titleBn: 'ফ্লিট ও রাইড পুলিং',
      category: 'Views',
      icon: <Truck size={15} />,
      action: () => { onNavigate('fleet'); onClose(); },
    },
    {
      id: 'view-bus',
      title: 'Bus Seat FIFO Waitlist & Booking',
      titleBn: 'বাস সিট ওয়েটলিস্ট',
      category: 'Views',
      icon: <Bus size={15} />,
      action: () => { onNavigate('bus'); onClose(); },
    },
    {
      id: 'view-parcel',
      title: 'Parcel Chain-of-Custody Tracker',
      titleBn: 'পার্সেল ট্র্যাকার',
      category: 'Views',
      icon: <Package size={15} />,
      action: () => { onNavigate('parcel'); onClose(); },
    },
    {
      id: 'view-attendance',
      title: 'Geofenced Mobile Attendance & Timesheets',
      titleBn: 'জিওফেন্স অ্যাটেন্ডেন্স',
      category: 'Views',
      icon: <MapPin size={15} />,
      action: () => { onNavigate('attendance'); onClose(); },
    },
    {
      id: 'view-inner-circle',
      title: "Chairman's Inner Circle Secure Messaging",
      titleBn: 'ইনার সার্কেল এনক্রিপ্টেড মেসেজিং',
      category: 'Views',
      icon: <FileSignature size={15} />,
      action: () => { onNavigate('inner_circle'); onClose(); },
    },
    {
      id: 'view-incident',
      title: 'HSE Incident Management & OSHA CAPA',
      titleBn: 'এইচএসই ইনসিডেন্ট',
      category: 'Views',
      icon: <AlertTriangle size={15} />,
      action: () => { onNavigate('incident'); onClose(); },
    },
    {
      id: 'view-claims',
      title: 'TA / DA & Conveyance Claim Portal',
      titleBn: 'টিএ/ডিএ ও যাতায়াত দাবি পোর্টাল',
      category: 'Views',
      icon: <LayoutDashboard size={15} />,
      action: () => { onNavigate('claims'); onClose(); },
    },
    {
      id: 'view-asset',
      title: 'Asset Lifecycle & Plant Reliability',
      titleBn: 'সম্পদ জীবনচক্র ও প্ল্যান্ট রক্ষণাবেক্ষণ',
      category: 'Views',
      icon: <ShieldCheck size={15} />,
      action: () => { onNavigate('asset'); onClose(); },
    },
    {
      id: 'view-guest',
      title: 'Guest & VIP Protocol Gate Pass',
      titleBn: 'অতিথি ও ভিআইপি প্রটোকল গেট পাস',
      category: 'Views',
      icon: <Package size={15} />,
      action: () => { onNavigate('guest'); onClose(); },
    },
    {
      id: 'view-workforce',
      title: 'Workforce Master & 4-Way Exit Clearance',
      titleBn: 'কর্মী মাস্টার ও বহির্গমন ছাড়পত্র',
      category: 'Views',
      icon: <Users size={15} />,
      action: () => { onNavigate('workforce'); onClose(); },
    },

    // Quick Actions
    {
      id: 'act-theme',
      title: `Switch to ${currentTheme === 'light' ? 'Dark' : 'Light'} Mode`,
      titleBn: currentTheme === 'light' ? 'ডার্ক মোড চালু করুন' : 'লাইট মোড চালু করুন',
      category: 'Quick Actions',
      icon: currentTheme === 'light' ? <Moon size={15} /> : <Sun size={15} />,
      action: () => { onToggleTheme(); onClose(); },
      shortcut: '⌘D',
    },
    {
      id: 'act-switch-chairman',
      title: 'Switch Persona: Chairman & Managing Director',
      titleBn: 'চেয়ারম্যান হিসেবে স্যুইচ করুন',
      category: 'Quick Actions',
      icon: <Shield size={15} color="#A51C30" />,
      action: () => { onRoleChange('chairman'); onClose(); },
    },
    {
      id: 'act-switch-gm',
      title: 'Switch Persona: Plant General Manager',
      titleBn: 'প্ল্যান্ট জেনারেল ম্যানেজার হিসেবে স্যুইচ করুন',
      category: 'Quick Actions',
      icon: <Shield size={15} color="#0369A1" />,
      action: () => { onRoleChange('plant_gm'); onClose(); },
    },
    {
      id: 'act-switch-hr',
      title: 'Switch Persona: GM HR & Corporate Services (Sayeda Afroza)',
      titleBn: 'জিএম এইচআর হিসেবে স্যুইচ করুন',
      category: 'Quick Actions',
      icon: <Users size={15} color="#7C3AED" />,
      action: () => { onRoleChange('hr_admin'); onClose(); },
    },
    {
      id: 'act-switch-transport',
      title: 'Switch Persona: Transport & Admin Supervisor',
      titleBn: 'পরিবহন সুপারভাইজার হিসেবে স্যুইচ করুন',
      category: 'Quick Actions',
      icon: <Shield size={15} color="#059669" />,
      action: () => { onRoleChange('transport_admin'); onClose(); },
    },

    // Searchable Records
    {
      id: 'rec-proc-0894',
      title: 'PROC/2026/0894: Safety Valve Procurement (৳48.5L)',
      titleBn: 'ক্রয় নথি: সেফটি ভালভ প্রকিউরমেন্ট',
      category: 'Records & Assets',
      icon: <FileSignature size={15} color="#A51C30" />,
      action: () => { onNavigate('notesheet'); onClose(); },
    },
    {
      id: 'rec-bsti-cert',
      title: 'BSTI/2026/L-089: Bitumen 60/70 Quality Standard Renewal',
      titleBn: 'বিএসটিআই বিটুমিন গুণমান লাইসেন্স',
      category: 'Records & Assets',
      icon: <ShieldCheck size={15} color="#D97706" />,
      action: () => { onNavigate('compliance'); onClose(); },
    },
    {
      id: 'rec-tanker-4820',
      title: 'DHAKA-METRO-D-11-4820: Toyota Land Cruiser Executive Fleet',
      titleBn: 'যানবাহন: ঢাকা-মেট্রো-ঘ-১১-৪৮২০',
      category: 'Records & Assets',
      icon: <Truck size={15} color="#0369A1" />,
      action: () => { onNavigate('fleet'); onClose(); },
    },
    {
      id: 'rec-employee-harun',
      title: 'Engr. Md. Harunur Rashid — Keraniganj Plant GM',
      titleBn: 'প্রকৌ. হারুনুর রশীদ — প্ল্যান্ট জিএম',
      category: 'Records & Assets',
      icon: <MapPin size={15} color="#7C3AED" />,
      action: () => { onNavigate('attendance'); onClose(); },
    },
  ];

  const filteredItems = items.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.titleBn.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
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
              'Type a command, note-sheet ID, vehicle plate, or view name...',
              'কমান্ড, নথি আইডি, গাড়ির নম্বর বা পেইজ অনুসন্ধান করুন...',
              lang
            )}
          />
          <div className="palette-esc-badge">ESC</div>
        </div>

        {/* Results List */}
        <div className="palette-list" ref={listRef}>
          {filteredItems.length === 0 ? (
            <div className="palette-empty">
              <span>{t('No matching actions or records found.', 'কোনো ফলাফল পাওয়া যায়নি।', lang)}</span>
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
            <span><kbd>↑</kbd> <kbd>↓</kbd> {t('Navigate', 'নেভিগেট', lang)}</span>
            <span><kbd>↵</kbd> {t('Select', 'নির্বাচন', lang)}</span>
            <span><kbd>esc</kbd> {t('Close', 'বন্ধ', lang)}</span>
          </div>
          <div className="palette-footer-badge">
            BOGCL Enterprise Omnisearch
          </div>
        </div>
      </div>
    </div>
  );
}
