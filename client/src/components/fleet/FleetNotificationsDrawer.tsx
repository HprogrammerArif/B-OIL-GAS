import React, { useState } from 'react';
import { useFleetStore, FleetNotification } from '../../store/fleetStore';
import { t } from '../../types';
import { showToast } from '../../App';
import {
  Bell, X, CheckCheck, Car, MessageSquare, Wrench,
  AlertTriangle, Clock, ArrowRight, Shield, CheckCircle2, UserCheck
} from 'lucide-react';

interface FleetNotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'employee' | 'admin';
  lang: 'en' | 'bn';
  onSelectRequisition?: (reqId: string) => void;
  onOpenChat?: (reqId: string) => void;
}

export default function FleetNotificationsDrawer({
  isOpen,
  onClose,
  userRole,
  lang,
  onSelectRequisition,
  onOpenChat,
}: FleetNotificationsDrawerProps) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useFleetStore();
  const [filter, setFilter] = useState<'all' | 'assignment' | 'driver_status' | 'maintenance' | 'chat_message'>('all');

  if (!isOpen) return null;

  // Filter notifications by role
  const roleNotifications = notifications.filter(
    n => n.targetRole === 'all' || (userRole === 'employee' ? n.targetRole === 'employee' : n.targetRole === 'admin')
  );

  const filtered = filter === 'all'
    ? roleNotifications
    : roleNotifications.filter(n => n.type === filter);

  const unreadCount = roleNotifications.filter(n => n.unread).length;

  const handleMarkAllRead = () => {
    markAllNotificationsRead(userRole);
    showToast(t('All fleet notifications marked as read', 'সকল নোটিফিকেশন পঠিত হিসেবে চিহ্নিত করা হয়েছে', lang), 'info');
  };

  const getNotifIcon = (type: FleetNotification['type']) => {
    switch (type) {
      case 'assignment':
        return <Car size={16} color="#2563EB" />;
      case 'requisition_created':
        return <UserCheck size={16} color="#B45309" />;
      case 'gate_out':
        return <Shield size={16} color="#059669" />;
      case 'gate_in':
        return <CheckCircle2 size={16} color="#10B981" />;
      case 'chat_message':
        return <MessageSquare size={16} color="#7C3AED" />;
      case 'driver_status':
        return <span style={{ fontSize: '14px' }}>💊</span>;
      case 'maintenance':
        return <Wrench size={16} color="#D97706" />;
      default:
        return <Bell size={16} color="#2563EB" />;
    }
  };

  return (
    <div className="modal-bg" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal"
        style={{
          maxWidth: '520px',
          width: '92%',
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#fff',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Bell size={17} color="#F87171" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#F8FAFC' }}>
                {t('Fleet Logistics Notifications', 'ফ্লিট নোটিফিকেশন ও অ্যালার্ট', lang)}
              </h3>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
                {unreadCount} {t('Unread Activity Alerts', 'টি নতুন নোটিফিকেশন', lang)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && (
              <button
                className="btn-sm-ghost"
                onClick={handleMarkAllRead}
                style={{
                  fontSize: '10.5px',
                  color: '#93C5FD',
                  borderColor: 'rgba(255,255,255,0.2)',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCheck size={12} />
                <span>{t('Mark All Read', 'সব পঠিত', lang)}</span>
              </button>
            )}
            <button
              className="modal-close"
              style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '28px', height: '28px' }}
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          padding: '8px 14px',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}>
          {[
            { id: 'all', label: t('All', 'সব', lang) },
            { id: 'assignment', label: t('Assignments', 'বরাদ্দ', lang) },
            { id: 'driver_status', label: t('Driver Status', 'চালক ছুটি', lang) },
            { id: 'maintenance', label: t('Maintenance', 'ওয়ার্কশপ', lang) },
            { id: 'chat_message', label: t('Trip Chat', 'চ্যাট', lang) },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              style={{
                padding: '3px 9px',
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer',
                border: filter === f.id ? '1.5px solid var(--brand-crimson)' : '1px solid #CBD5E1',
                background: filter === f.id ? 'var(--brand-crimson)' : '#fff',
                color: filter === f.id ? '#fff' : '#475569',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          background: 'var(--brand-card-bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '35px 10px', color: '#94A3B8' }}>
              <Bell size={28} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '12.5px', fontWeight: 600 }}>
                {t('No notifications found in this category.', 'এই ক্যাটাগরিতে কোনো নোটিফিকেশন নেই।', lang)}
              </div>
            </div>
          ) : (
            filtered.map(n => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                style={{
                  border: n.unread ? '1.5px solid #93C5FD' : '1px solid #E2E8F0',
                  background: n.unread ? '#EFF6FF' : '#fff',
                  borderRadius: '9px',
                  padding: '10px 12px',
                  display: 'flex',
                  gap: '10px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: n.unread ? '#DBEAFE' : '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}>
                  {getNotifIcon(n.type)}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '12.5px', color: '#0F172A' }}>
                      {n.title}
                    </div>
                    <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>
                      {n.time}
                    </span>
                  </div>

                  <p style={{ margin: '3px 0 6px 0', fontSize: '11.5px', color: '#475569', lineHeight: '1.4' }}>
                    {n.message}
                  </p>

                  {/* Action Shortcuts */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    {n.requisitionId && onSelectRequisition && (
                      <button
                        className="btn-sm-ghost"
                        style={{ fontSize: '10px', padding: '2px 7px', color: '#2563EB', borderColor: '#BFDBFE', background: '#fff' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationRead(n.id);
                          onSelectRequisition(n.requisitionId!);
                          onClose();
                        }}
                      >
                        <Car size={11} />
                        <span>{t('View Trip Pass', 'পাস দেখুন', lang)}</span>
                      </button>
                    )}

                    {n.requisitionId && onOpenChat && (
                      <button
                        className="btn-sm-ghost"
                        style={{ fontSize: '10px', padding: '2px 7px', color: '#7C3AED', borderColor: '#DDD6FE', background: '#fff' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationRead(n.id);
                          onOpenChat(n.requisitionId!);
                          onClose();
                        }}
                      >
                        <MessageSquare size={11} />
                        <span>{t('Open Trip Chat', 'চ্যাট খুলুন', lang)}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Unread Dot */}
                {n.unread && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#2563EB',
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                  }} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
