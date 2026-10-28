import React from 'react';
import { NoticeItem } from '../views/dashboard/types';
import { NOTICE_BOARD } from '../views/dashboard/dashboardData';

export interface BroadcastPayload {
  id: string;
  title: string;
  body: string;
  requireAck: boolean;
  sendSms: boolean;
  author: string;
  authorRole: string;
  timestamp: string;
}

class NoticeStore {
  private notices: NoticeItem[] = [...NOTICE_BOARD];
  private activeBroadcast: BroadcastPayload | null = null;
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getNotices(): NoticeItem[] {
    return this.notices;
  }

  getActiveBroadcast(): BroadcastPayload | null {
    return this.activeBroadcast;
  }

  // 1. Add standard formal circular or departmental notice
  addNotice(notice: NoticeItem): NoticeItem {
    const newNotice: NoticeItem = {
      ...notice,
      id: notice.id || `NOT-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: notice.date || 'Today, Just Now',
    };
    this.notices = [newNotice, ...this.notices];
    this.notify();
    return newNotice;
  }

  // 2. Add an Executive Broadcast:
  // Immediately archives to the Notice List as top pinned priority AND sets active broadcast
  addBroadcast(data: {
    title: string;
    body: string;
    requireAck: boolean;
    sendSms: boolean;
    author?: string;
    authorRole?: string;
  }): { notice: NoticeItem; broadcast: BroadcastPayload } {
    const id = `BC-${Date.now().toString().slice(-4)}`;
    const timestamp = 'Today, Just Now';
    const author = data.author || 'Ahmed Akbar Sobhan';
    const authorRole = data.authorRole || 'Chairman & Managing Director';

    const broadcastPayload: BroadcastPayload = {
      id,
      title: data.title,
      body: data.body,
      requireAck: data.requireAck,
      sendSms: data.sendSms,
      author,
      authorRole,
      timestamp,
    };

    const archivedNotice: NoticeItem = {
      id: `NOT-${id}`,
      title: `[BROADCAST] ${data.title}`,
      title_bn: `[জরুরি সম্প্রচার] ${data.title}`,
      tag: '📢 EXECUTIVE BROADCAST',
      category: 'executive',
      priority: 'critical',
      date: timestamp,
      author,
      authorRole,
      targetAudience: 'Entire Group (All 847 Employees across 6 Locations)',
      body: data.body,
      body_bn: data.body,
      pinned: true,
      read: false,
      requiresAck: data.requireAck,
      acknowledgedCount: 1,
      totalRecipients: 847,
      referenceNo: `BOGCL/EXEC/BC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    };

    // Prepend to top of notice board
    this.notices = [archivedNotice, ...this.notices];
    this.activeBroadcast = broadcastPayload;
    this.notify();

    return { notice: archivedNotice, broadcast: broadcastPayload };
  }

  dismissActiveBroadcast() {
    this.activeBroadcast = null;
    this.notify();
  }

  acknowledgeNotice(id: string) {
    this.notices = this.notices.map((n) => {
      if (n.id === id || n.title === id) {
        return {
          ...n,
          read: true,
          acknowledgedCount: (n.acknowledgedCount || 0) + 1,
        };
      }
      return n;
    });
    this.notify();
  }

  togglePin(id: string) {
    this.notices = this.notices.map((n) => {
      if (n.id === id || n.title === id) {
        return {
          ...n,
          pinned: !n.pinned,
        };
      }
      return n;
    });
    this.notify();
  }
}

export const noticeStore = new NoticeStore();

export function useNoticeStore() {
  const [notices, setNotices] = React.useState<NoticeItem[]>(noticeStore.getNotices());
  const [activeBroadcast, setActiveBroadcast] = React.useState<BroadcastPayload | null>(
    noticeStore.getActiveBroadcast()
  );

  React.useEffect(() => {
    const unsubscribe = noticeStore.subscribe(() => {
      setNotices([...noticeStore.getNotices()]);
      setActiveBroadcast(noticeStore.getActiveBroadcast());
    });
    return unsubscribe;
  }, []);

  return {
    notices,
    activeBroadcast,
    addNotice: noticeStore.addNotice.bind(noticeStore),
    addBroadcast: noticeStore.addBroadcast.bind(noticeStore),
    dismissActiveBroadcast: noticeStore.dismissActiveBroadcast.bind(noticeStore),
    acknowledgeNotice: noticeStore.acknowledgeNotice.bind(noticeStore),
    togglePin: noticeStore.togglePin.bind(noticeStore),
  };
}
