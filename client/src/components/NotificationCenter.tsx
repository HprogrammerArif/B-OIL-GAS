import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AppRole, Lang, t, AppView, ROLE_META } from '../types';
import { Bell, CheckCheck, FileText, AlertTriangle, Truck, ShieldCheck } from 'lucide-react';
import { showToast } from '../App';
import { useApprovalStore } from '../store/approvalStore';
import { useFleetStore } from '../store/fleetStore';
import { useNoticeStore } from '../store/noticeStore';
import { getAllowedViewsForRole } from './Sidebar';

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

interface NotificationCenterProps {
  role?: AppRole;
  lang: Lang;
  onNavigate: (view: AppView) => void;
}

export default function NotificationCenter({
  role = 'chairman',
  lang,
  onNavigate,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set(['sys-sync']));
  const [filter, setFilter] = useState<'all' | 'approval' | 'safety' | 'logistics'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { approvalItems } = useApprovalStore();
  const { notifications: fleetNotifs, markNotificationRead } = useFleetStore();
  const { activeBroadcast } = useNoticeStore();

  const allowedViews = useMemo(() => getAllowedViewsForRole(role), [role]);
  const meta = ROLE_META[role];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];

    // 1. Live Company Announcement (if active)
    if (activeBroadcast) {
      list.push({
        id: `bc-${activeBroadcast.id}`,
        category: 'system',
        title: `Announcement: ${activeBroadcast.title}`,
        titleBn: `ঘোষণা: ${activeBroadcast.title}`,
        desc: `${activeBroadcast.body.slice(0, 95)}... — ${activeBroadcast.author}`,
        descBn: `${activeBroadcast.body.slice(0, 95)}... — ${activeBroadcast.author}`,
        time: activeBroadcast.timestamp,
        unread: !readIds.has(`bc-${activeBroadcast.id}`),
        targetView: 'dashboard',
      });
    }

    // 2. Role-Specific Relevant Notifications
    if (role === 'driver') {
      list.push(
        {
          id: 'drv-1',
          category: 'logistics',
          title: 'Active Trip Assigned (REQ-2026-442)',
          titleBn: 'নির্ধারিত ট্রিপ চালু রয়েছে (REQ-2026-442)',
          desc: 'Head Office to Motijheel Bangladesh Bank with Farida Begum (Toyota Prado GHA-13-8821).',
          descBn: 'বারিধারা প্রধান কার্যালয় হতে মতিঝিল বাংলাদেশ ব্যাংক (ফরিদা বেগম)।',
          time: '15m ago',
          unread: !readIds.has('drv-1'),
          targetView: 'fleet',
        },
        {
          id: 'drv-2',
          category: 'safety',
          title: 'Morning Fitness & License Check Passed',
          titleBn: 'সকালের ফিটনেস ও লাইসেন্স যাচাই সম্পন্ন',
          desc: 'Duty check-in completed at 06:48 AM at Head Office Gate-1.',
          descBn: 'সকাল ০৬:৪৮ মিনিটে প্রধান কার্যালয় গেট-১ এ উপস্থিতি নিশ্চিত হয়েছে।',
          time: '2h ago',
          unread: !readIds.has('drv-2'),
          targetView: 'attendance',
        }
      );
    } else if (role === 'employee') {
      list.push(
        {
          id: 'emp-1',
          category: 'approval',
          title: 'Confirm Receipt of New Office Phone',
          titleBn: 'নতুন অফিস ফোনের প্রাপ্তি নিশ্চিত করুন',
          desc: 'iPhone 15 Business Handset (BOGCL-IT-PHN-310) is waiting for your 1-click confirmation.',
          descBn: 'আপনার নামে বরাদ্দকৃত অফিস ফোনের প্রাপ্তি নিশ্চিত করুন।',
          time: '20m ago',
          unread: !readIds.has('emp-1'),
          targetView: 'asset',
        },
        {
          id: 'emp-2',
          category: 'logistics',
          title: 'Visitor Expected Today at 3:15 PM',
          titleBn: 'আজ বিকাল ৩:১৫ মিনিটে অতিথি আগমন',
          desc: 'Engr. Mahfuzur Rahman (RHD) pre-registered for Level 4 Meeting Room B.',
          descBn: 'প্রকৌ. মাহফুজুর রহমান (সওজ) বিকাল ৩:১৫ মিনিটে ৪র্থ তলায় আসবেন।',
          time: '1h ago',
          unread: !readIds.has('emp-2'),
          targetView: 'guest',
        },
        {
          id: 'emp-3',
          category: 'approval',
          title: '2 Expense Claims Under Review',
          titleBn: '২টি ভ্রমণ ও যাতায়াত বিল অনুমোদনের অপেক্ষায়',
          desc: 'Chattogram Dealer Visit (৳14,850) and Local Client Visits (৳5,420) are with Finance.',
          descBn: 'চট্টগ্রাম ডিলার ভিজিট ও স্থানীয় যাতায়াত বিল অর্থ বিভাগে পর্যালোচনায় রয়েছে।',
          time: '3h ago',
          unread: !readIds.has('emp-3'),
          targetView: 'claims',
        }
      );
    } else {
      // Management / Supervisor Roles
      if (allowedViews.has('approvals') && approvalItems.length > 0) {
        const top = approvalItems[0];
        list.push({
          id: `apr-top-${top.id}`,
          category: 'approval',
          title: `${approvalItems.length} Items Waiting for Approval`,
          titleBn: `${approvalItems.length}টি প্রস্তাব অনুমোদনের অপেক্ষায়`,
          desc: `Priority: ${top.title} (${top.amount || top.requester}).`,
          descBn: `অগ্রাধিকার: ${top.titleBn} (${top.amount || top.requester})।`,
          time: '5m ago',
          unread: !readIds.has(`apr-top-${top.id}`),
          targetView: 'approvals',
        });
      }

      if (allowedViews.has('compliance')) {
        list.push({
          id: 'perm-urgent',
          category: 'safety',
          title: 'Import Quota Permit Renews in 7 Days',
          titleBn: 'কাঁচামাল আমদানি কোটা নবায়নে ৭ দিন বাকি',
          desc: 'Annual Raw Material Import Permit (EMRD/BOGCL/2026/09) is at Ministry review.',
          descBn: 'বার্ষিক কাঁচামাল আমদানি পারমিট জ্বালানি মন্ত্রণালয়ে চূড়ান্ত পর্যায়ে রয়েছে।',
          time: '35m ago',
          unread: !readIds.has('perm-urgent'),
          targetView: 'compliance',
        });
      }

      if (allowedViews.has('fleet')) {
        const recentFleet = fleetNotifs.slice(0, 2);
        recentFleet.forEach((fn) => {
          list.push({
            id: `fn-${fn.id}`,
            category: 'logistics',
            title: fn.title,
            titleBn: fn.title,
            desc: fn.message,
            descBn: fn.message,
            time: fn.time,
            unread: fn.unread && !readIds.has(`fn-${fn.id}`),
            targetView: 'fleet',
          });
        });
      }
    }

    // Common System Sync Notice
    list.push({
      id: 'sys-sync',
      category: 'system',
      title: 'Daily Attendance & Accounts Synced',
      titleBn: 'দৈনন্দিন উপস্থিতি ও হিসাব সিঙ্ক সম্পন্ন',
      desc: `All records for ${meta.siteLabel} are up to date for 29 Oct 2026.`,
      descBn: `${meta.siteLabelBn}-এর সকল তথ্য হালনাগাদ রয়েছে।`,
      time: 'Today, 09:00 AM',
      unread: !readIds.has('sys-sync'),
      targetView: 'dashboard',
    });

    return list;
  }, [activeBroadcast, role, allowedViews, approvalItems, fleetNotifs, readIds, meta]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    const next = new Set(readIds);
    notifications.forEach((n) => {
      next.add(n.id);
      if (n.id.startsWith('fn-')) {
        markNotificationRead(n.id.replace('fn-', ''));
      }
    });
    setReadIds(next);
    showToast(t('All notifications marked as read.', 'সকল নোটিফিকেশন পঠিত হিসেবে চিহ্নিত করা হয়েছে।', lang), 'info');
  };

  const handleItemClick = (item: NotificationItem) => {
    setReadIds((prev) => new Set(prev).add(item.id));
    if (item.id.startsWith('fn-')) {
      markNotificationRead(item.id.replace('fn-', ''));
    }
    if (item.targetView && allowedViews.has(item.targetView)) {
      onNavigate(item.targetView);
      setIsOpen(false);
    }
  };

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter((n) => n.category === filter);

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
        title={t('Notifications & Updates', 'নোটিফিকেশন ও সাম্প্রতিক আপডেট', lang)}
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
              <h4>{t('Notifications & Updates', 'নোটিফিকেশন ও সাম্প্রতিক তথ্য', lang)}</h4>
              <span className="notif-count-pill">{unreadCount} {t('new', 'নতুন', lang)}</span>
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
              {t('Safety & Permits', 'নিরাপত্তা', lang)}
            </button>
            <button
              className={`notif-tab ${filter === 'logistics' ? 'active' : ''}`}
              onClick={() => setFilter('logistics')}
            >
              {t('Transport', 'পরিবহন', lang)}
            </button>
          </div>

          {/* Notifications List */}
          <div className="notif-list">
            {filtered.length === 0 ? (
              <div className="notif-empty">
                <span>{t('No notifications in this tab.', 'এই বিভাগে কোনো নোটিফিকেশন নেই।', lang)}</span>
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
              🔔 {t(`Live Updates for ${meta.name}`, `${meta.nameBn}-এর লাইভ আপডেট`, lang)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
