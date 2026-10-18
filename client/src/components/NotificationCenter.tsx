import React, { useState, useRef, useEffect } from 'react';
import { Lang, t, AppView } from '../types';
import { Bell, CheckCheck, FileText, AlertTriangle, Truck, ShieldCheck, Clock, ExternalLink } from 'lucide-react';
import { showToast } from '../App';

interface NotificationItem {
  id: string;
  category: 'approval' | 'safety' | 'logistics' | 'system';
  title: string;
  titleBn: string;
  desc: string;
  descBn: string;
  time: string;
  unread: boolean;
  targetView?: AppView;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    category: 'approval',
    title: 'High-Value Note Escalation',
    titleBn: 'জরুরি নথি অনুমোদন বাকি',
    desc: 'Farida Begum forwarded Note PROC/0894 (Safety Valve ৳48.5L) for Chairman sign-off.',
    descBn: 'ফরিদা বেগম নোট PROC/0894 (সেফটি ভালভ ৪৮.৫ লাখ টাকা) চেয়ারম্যান স্বাক্ষরের জন্য পাঠিয়েছেন।',
    time: '4m ago',
    unread: true,
    targetView: 'notesheet',
  },
  {
    id: 'n-2',
    category: 'safety',
    title: 'Keraniganj Bitumen Tank Pressure Normal',
    titleBn: 'কেরানীগঞ্জ বিটুমিন ট্যাঙ্ক চাপ স্বাভাবিক',
    desc: 'DCS SCADA sensor TK-01 returned to standard 162°C nominal envelope.',
    descBn: 'ডিসিএস সেন্সর TK-01 স্বাভাবিক অপারেটিং তাপমাত্রা ১৬২° সে.-এ ফিরে এসেছে।',
    time: '18m ago',
    unread: true,
    targetView: 'dashboard',
  },
  {
    id: 'n-3',
    category: 'logistics',
    title: 'Smart Fleet Ride Pooling Activated',
    titleBn: 'ফ্লিট রাইড পুলিং কার্যকর হয়েছে',
    desc: 'Pool #3 combined 2 passenger requests to Keraniganj Plant, saving 18.4L octane.',
    descBn: 'পুল #৩ কেরানীগঞ্জ প্ল্যান্টের ২ যাত্রী একীভূত করে ১৮.৪ লিটার অকটেন সাশ্রয় করেছে।',
    time: '1h ago',
    unread: true,
    targetView: 'fleet',
  },
  {
    id: 'n-4',
    category: 'system',
    title: 'SAP S/4HANA Enterprise Gateway Synced',
    titleBn: 'এসএপি গেটওয়ে সফলভাবে সিঙ্ক হয়েছে',
    desc: '32 plant inventory movements & attendance batches posted to SAP Finance ledger.',
    descBn: '৩২টি প্ল্যান্ট ইনভেন্টরি ও উপস্থিতি ব্যাচ এসএপি লেজারে সফলভাবে আপলোড হয়েছে।',
    time: '2h ago',
    unread: false,
    targetView: 'dashboard',
  },
  {
    id: 'n-5',
    category: 'safety',
    title: 'BSTI License Audit Scheduled',
    titleBn: 'বিএসটিআই লাইসেন্স অডিট নির্ধারিত',
    desc: 'Statutory inspection by BSTI Directorate booked for upcoming Tuesday 11:00 AM.',
    descBn: 'বিএসটিআই অধিদপ্তরের বার্ষিক পরিদর্শন আগামী মঙ্গলবার সকাল ১১টায় অনুষ্ঠিত হবে।',
    time: '4h ago',
    unread: false,
    targetView: 'compliance',
  },
];

interface NotificationCenterProps {
  lang: Lang;
  onNavigate: (view: AppView) => void;
}

export default function NotificationCenter({ lang, onNavigate }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'approval' | 'safety' | 'logistics'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    showToast(t('All notifications marked as read', 'সকল নোটিফিকেশন পঠিত হিসেবে চিহ্নিত', lang), 'info');
  };

  const handleItemClick = (item: NotificationItem) => {
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, unread: false } : n));
    if (item.targetView) {
      onNavigate(item.targetView);
      setIsOpen(false);
    }
  };

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => n.category === filter);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'approval': return <FileText size={14} color="#A51C30" />;
      case 'safety': return <AlertTriangle size={14} color="#D97706" />;
      case 'logistics': return <Truck size={14} color="#0369A1" />;
      case 'system': return <ShieldCheck size={14} color="#059669" />;
      default: return <Bell size={14} />;
    }
  };

  return (
    <div className="notification-center-wrap" ref={dropdownRef}>
      <button
        className="btn-icon-topbar"
        onClick={() => setIsOpen(!isOpen)}
        title={t('Notifications & Activity Stream', 'নোটিফিকেশন ও কার্যক্রম', lang)}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="notification-badge-pulse">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notif-header">
            <div className="notif-header-title">
              <h4>{t('Activity & Notifications', 'নোটিফিকেশন ও সাম্প্রতিক তথ্য', lang)}</h4>
              <span className="notif-count-pill">{unreadCount} {t('unread', 'নতুন', lang)}</span>
            </div>

            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button className="notif-mark-read-btn" onClick={handleMarkAllRead}>
                  <CheckCheck size={13} />
                  <span>{t('Mark all read', 'সব পঠিত', lang)}</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="notif-filter-tabs">
            <button
              className={`notif-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              {t('All', 'সকল', lang)}
            </button>
            <button
              className={`notif-tab ${filter === 'approval' ? 'active' : ''}`}
              onClick={() => setFilter('approval')}
            >
              {t('Approvals', 'অনুমোদন', lang)}
            </button>
            <button
              className={`notif-tab ${filter === 'safety' ? 'active' : ''}`}
              onClick={() => setFilter('safety')}
            >
              {t('Safety', 'নিরাপত্তা', lang)}
            </button>
            <button
              className={`notif-tab ${filter === 'logistics' ? 'active' : ''}`}
              onClick={() => setFilter('logistics')}
            >
              {t('Logistics', 'লজিস্টিক্স', lang)}
            </button>
          </div>

          {/* Notifications List */}
          <div className="notif-list">
            {filtered.length === 0 ? (
              <div className="notif-empty">
                <span>{t('No notifications in this category.', 'কোনো নোটিফিকেশন নেই।', lang)}</span>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className={`notif-item ${item.unread ? 'unread' : ''}`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="notif-item-icon">
                    {getCategoryIcon(item.category)}
                  </div>

                  <div className="notif-item-body">
                    <div className="notif-item-title-row">
                      <span className="notif-title">{t(item.title, item.titleBn, lang)}</span>
                      <span className="notif-time">{item.time}</span>
                    </div>
                    <p className="notif-desc">{t(item.desc, item.descBn, lang)}</p>
                  </div>

                  {item.unread && <span className="notif-unread-dot" />}
                </div>
              ))
            )}
          </div>

          <div className="notif-footer">
            <span style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>
              ⚡ Industrial SCADA & SAP S/4HANA Event Bus
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
