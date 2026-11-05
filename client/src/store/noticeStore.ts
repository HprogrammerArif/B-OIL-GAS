import { loadPersisted, savePersisted } from '../lib/persist';
import { nextRef } from '../lib/refs';
import { nowStamp } from '../lib/clock';
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

const PERSIST_NAME = 'notices';
const PERSIST_VERSION = 1;

class NoticeStore {
  private notices: NoticeItem[] = loadPersisted<NoticeItem[]>(PERSIST_NAME, PERSIST_VERSION) ?? [...NOTICE_BOARD];
  // The live banner is intentionally session-only: it should not reappear after a reload.
  private activeBroadcast: BroadcastPayload | null = null;
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
    savePersisted(PERSIST_NAME, PERSIST_VERSION, () => this.notices);
  }

  getNotices(): NoticeItem[] {
    return this.notices;
  }

  getActiveBroadcast(): BroadcastPayload | null {
    return this.activeBroadcast;
  }

  addNotice(notice: NoticeItem): NoticeItem {
    const newNotice: NoticeItem = {
      ...notice,
      id: notice.id || nextRef('NOT'),
      date: notice.date || nowStamp(),
    };
    this.notices = [newNotice, ...this.notices];
    this.notify();
    return newNotice;
  }

  addBroadcast(data: {
    title: string;
    body: string;
    requireAck: boolean;
    sendSms: boolean;
    author?: string;
    authorRole?: string;
  }): { notice: NoticeItem; broadcast: BroadcastPayload } {
    const id = `BC-${Date.now().toString().slice(-4)}`;
    const timestamp = nowStamp();
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
      title: `[ANNOUNCEMENT] ${data.title}`,
      title_bn: `[বিশেষ ঘোষণা] ${data.title}`,
      tag: 'COMPANY ANNOUNCEMENT',
      category: 'executive',
      priority: 'critical',
      date: timestamp,
      author,
      authorRole,
      targetAudience: 'All Staff Across Head Office, Keraniganj Plant & Chattogram Depot',
      body: data.body,
      body_bn: data.body,
      pinned: true,
      read: false,
      requiresAck: data.requireAck,
      acknowledgedCount: 1,
      totalRecipients: 788,
      referenceNo: `BOGCL/NOTICE/${nextRef('NTC', 3).slice(4)}`,
    };

    this.notices = [archivedNotice, ...this.notices];
    this.activeBroadcast = broadcastPayload;
    this.notify();

    return { notice: archivedNotice, broadcast: broadcastPayload };
  }

  dismissActiveBroadcast() {
    this.activeBroadcast = null;
    this.notify();
  }

  markNoticeRead(id: string) {
    this.notices = this.notices.map((n) => {
      if ((n.id === id || n.title === id) && !n.read) {
        return { ...n, read: true };
      }
      return n;
    });
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
    markNoticeRead: noticeStore.markNoticeRead.bind(noticeStore),
    acknowledgeNotice: noticeStore.acknowledgeNotice.bind(noticeStore),
    togglePin: noticeStore.togglePin.bind(noticeStore),
  };
}
