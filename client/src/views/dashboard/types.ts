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
  title: string;
  title_bn: string;
  tag: string;
  date: string;
  read: boolean;
  pinned: boolean;
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
  equipment: string;
  breaker: string;
  issuedTo: string;
  status: string;
  hazard: string;
}

export interface ShiftHandoverItem {
  shift: string;
  handover: string;
  time: string;
  status: string;
  notes: string;
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
