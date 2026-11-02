import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AppRole, Lang, t, AppView } from '../types';
import { Bell, CheckCheck, FileText, AlertTriangle, Truck, ShieldCheck } from 'lucide-react';
import { showToast } from './ToastManager';
import { useMyApprovalQueue } from '../views/approvals/config';
import { useFleetStore } from '../store/fleetStore';
import { useNoticeStore } from '../store/noticeStore';
import { useOperationsStore } from '../store/operationsStore';
import { useAssetStore } from '../store/assetStore';
import { useApprovalStore } from '../store/approvalStore';
import { allowedViews as getAllowedViewsForRole, type Permission } from '../auth/permissions';
import { useCurrentUser } from '../auth/session';
import { fleetModeFor, notificationsVisibleTo, requisitionsVisibleTo } from '../views/fleet/config';
import { guestModeFor, visitorsVisibleTo } from '../views/guest/config';
import { isMine as isMyClaim, isPending as isPendingClaim } from '../views/claims/config';

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
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'approval' | 'safety' | 'logistics'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { pending: approvalItems } = useMyApprovalQueue();
  const { notifications: fleetNotifs, markNotificationRead, requisitions } = useFleetStore();
  const { activeBroadcast } = useNoticeStore();
  const { licenses, visitors } = useOperationsStore();
  const { assets } = useAssetStore();
  const { claims } = useApprovalStore();
  const user = useCurrentUser();

  const allowedViews = useMemo(() => getAllowedViewsForRole(role), [role]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
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

    // 2. Items derived from records this user is responsible for
    if (user) {
      const can = (p: Permission) => user.permissions.has(p);

      if (allowedViews.has('approvals') && approvalItems.length > 0) {
        const top = approvalItems[0];
        list.push({
          id: `apr-top-${top.id}`,
          category: 'approval',
          title: `${approvalItems.length} Items Waiting for Approval`,
          titleBn: `${approvalItems.length}টি প্রস্তাব অনুমোদনের অপেক্ষায়`,
          desc: `Next: ${top.title} (${top.amount || top.requester}).`,
          descBn: `পরবর্তী: ${top.titleBn} (${top.amount || top.requester})।`,
          time: t('Action needed', 'পদক্ষেপ প্রয়োজন', lang),
          unread: !readIds.has(`apr-top-${top.id}`),
          targetView: 'approvals',
        });
      }

      if (can('compliance:view')) {
        const nearest = licenses
          .filter((l) => l.stage < 5 && l.daysLeft <= 30)
          .sort((a, b) => a.daysLeft - b.daysLeft)[0];
        if (nearest) {
          list.push({
            id: `perm-${nearest.id}`,
            category: 'safety',
            title: `${nearest.title} expires in ${nearest.daysLeft} days`,
            titleBn: `${nearest.titleBn} — মেয়াদ শেষ হতে ${nearest.daysLeft} দিন বাকি`,
            desc: `${nearest.refNo} · ${nearest.agency} · renewal stage ${nearest.stage} of 5.`,
            descBn: `${nearest.refNo} · ${nearest.agencyBn} · নবায়ন ধাপ ${nearest.stage}/৫।`,
            time: t('Renewal due', 'নবায়ন বাকি', lang),
            unread: !readIds.has(`perm-${nearest.id}`),
            targetView: 'compliance',
          });
        }
      }

      if (allowedViews.has('asset')) {
        assets
          .filter((a) => a.custodianEmpId === user.empId && !a.custodianAcknowledged)
          .slice(0, 2)
          .forEach((a) => {
            list.push({
              id: `ast-${a.id}`,
              category: 'approval',
              title: `Confirm receipt: ${a.name}`,
              titleBn: `প্রাপ্তি নিশ্চিত করুন: ${a.name}`,
              desc: `${a.tag} is issued to you and awaits your custody sign-off.`,
              descBn: `${a.tag} আপনার নামে বরাদ্দ — হেফাজত স্বীকৃতি প্রয়োজন।`,
              time: t('Pending', 'অপেক্ষমাণ', lang),
              unread: !readIds.has(`ast-${a.id}`),
              targetView: 'asset',
            });
          });
      }

      if (allowedViews.has('guest')) {
        visitorsVisibleTo(user, guestModeFor(user), visitors, 'my_guests')
          .filter((v) => v.status === 'pre_registered' && v.expectedDate.startsWith('Today'))
          .slice(0, 2)
          .forEach((v) => {
            list.push({
              id: `vis-${v.id}`,
              category: 'logistics',
              title: `Visitor expected today at ${v.expectedTime}`,
              titleBn: `আজ ${v.expectedTime}-এ অতিথি আসবেন`,
              desc: `${v.name} (${v.organization}) — ${v.purpose}.`,
              descBn: `${v.name} (${v.organization}) — ${v.purpose}।`,
              time: v.expectedTime,
              unread: !readIds.has(`vis-${v.id}`),
              targetView: 'guest',
            });
          });
      }

      if (allowedViews.has('claims') && !can('claims:view_all')) {
        const myPending = claims.filter((c) => isMyClaim(c, user) && isPendingClaim(c));

        if (myPending.length > 0) {
          const total = myPending.reduce((sum, c) => sum + c.amount, 0);
          list.push({
            id: `clm-mine-${myPending.map((c) => c.id).join('-')}`,
            category: 'approval',
            title: `${myPending.length} Expense Claim${myPending.length > 1 ? 's' : ''} Under Review`,
            titleBn: `${myPending.length}টি খরচের দাবি পর্যালোচনায়`,
            desc: `${myPending.map((c) => c.purpose).join(', ')} — ৳${total.toLocaleString('en-IN')} total.`,
            descBn: `মোট ৳${total.toLocaleString('en-IN')} পর্যালোচনাধীন।`,
            time: t('In review', 'পর্যালোচনায়', lang),
            unread: !readIds.has(`clm-mine-${myPending.map((c) => c.id).join('-')}`),
            targetView: 'claims',
          });
        }
      }

      if (allowedViews.has('fleet')) {
        const fleetMode = fleetModeFor(user);
        const myReqs = requisitionsVisibleTo(user, fleetMode, requisitions);
        if (fleetMode === 'driver') {
          myReqs
            .filter((r) => r.status === 'assigned' || r.status === 'in_transit')
            .slice(0, 2)
            .forEach((r) => {
              list.push({
                id: `trip-${r.id}`,
                category: 'logistics',
                title: `Trip assigned (${r.id})`,
                titleBn: `ট্রিপ নির্ধারিত (${r.id})`,
                desc: `${r.from} → ${r.to} with ${r.requesterName}.`,
                descBn: `${r.from} হতে ${r.to} — ${r.requesterName}।`,
                time: t('Assigned', 'নির্ধারিত', lang),
                unread: !readIds.has(`trip-${r.id}`),
                targetView: 'fleet',
              });
            });
        }
        notificationsVisibleTo(fleetMode, fleetNotifs, myReqs)
          .slice(0, 2)
          .forEach((fn) => {
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

    return list;
  }, [activeBroadcast, user, allowedViews, approvalItems, licenses, assets, visitors, claims, requisitions, fleetNotifs, readIds, lang]);

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
      case 'approval': return <FileText size={14} color="var(--brand-crimson)" />;
      case 'safety': return <AlertTriangle size={14} color="var(--status-warning)" />;
      case 'logistics': return <Truck size={14} color="var(--status-info)" />;
      case 'system': return <ShieldCheck size={14} color="var(--status-success)" />;
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
              {t(`Updates for ${user?.name ?? ''}`, `${user?.name ?? ''}-এর হালনাগাদ`, lang)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
