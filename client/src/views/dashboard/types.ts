import React from 'react';
import { Lang, AppRole } from '../../types';
import { DetailDrawerData } from '../../components/DetailDrawer';

export interface DashboardSubViewProps {
  role: AppRole;
  lang: Lang;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDetailDrawer?: (item: DetailDrawerData) => void;
}

export interface StatDef {
  label: string;
  labelBn: string;
  value: string;
  sub: string;
  type: string;
  icon: React.ReactNode;
  sparkline: number[];
  sparkColor: string;
}

export interface InnerCircleMember {
  name: string;
  role: string;
  initials: string;
  color: string;
  status: string;
  statusLabel: string;
  statusLabelBn: string;
  badge: string;
  location: string;
  phone: string;
}

export interface NoticeItem {
  id?: string;
  title: string;
  title_bn: string;
  tag: string;
  date: string;
  read: boolean;
  pinned: boolean;
  body?: string;
  body_bn?: string;
  category?: 'safety' | 'operational' | 'hr' | 'executive' | 'urgent';
  targetAudience?: string;
  priority?: 'critical' | 'high' | 'normal';
  author?: string;
  authorRole?: string;
  requiresAck?: boolean;
  acknowledgedCount?: number;
  totalRecipients?: number;
  referenceNo?: string;
}

export interface DcsAlarmItem {
  id: string;
  tag: string;
  desc: string;
  value: string;
  limit: string;
  severity: 'high' | 'medium' | 'low';
  time: string;
  ack: boolean;
}

export interface LotoPermitItem {
  id: string;
  type?: 'loto' | 'hot_work' | 'confined_space';
  typeLabel?: string;
  equipment: string;
  equipmentTag?: string;
  location?: string;
  breaker: string;
  lockoutBoxNo?: string;
  padlockCount?: number;
  issuedTo: string;
  issuedBy?: string;
  status: string;
  hazard: string;
  plainSummary?: string;
  checklist?: {
    powerCutVerified: boolean;
    valvesDrained: boolean;
    physicalPadlockLocked: boolean;
    gasTestPassed: boolean;
    warningTagHung: boolean;
  };
  timeIssued?: string;
  validUntil?: string;
}

export interface ShiftHandoverItem {
  id?: string;
  shift: string;
  shiftType?: 'morning' | 'evening' | 'night';
  handover: string;
  outgoingEngineer?: string;
  incomingEngineer?: string;
  time: string;
  status: string;
  notes: string;
  criticalWatchItems?: string[];
  safetyChecklistSigned?: boolean;
}

export interface VehicleRequestItem {
  id: string;
  requester: string;
  designation: string;
  from: string;
  to: string;
  date: string;
  time: string;
  passengers: number;
  priority: string;
  status: string;
}

export interface HodQueueItem {
  id: string;
  type: string;
  icon: string;
  title: string;
  detail: string;
  dept: string;
  time: string;
  urgency: string;
  costTk: number;
}
