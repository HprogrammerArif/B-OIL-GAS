export type AppRole = 'chairman' | 'plant_gm' | 'hr_admin' | 'transport_admin' | 'hod' | 'employee' | 'driver';
export type AppView =
  | 'dashboard'
  | 'inner_circle'   // Chairman's secure messaging
  | 'workforce'      // HR Workforce Master Directory & Offboarding
  | 'notesheet'
  | 'compliance'
  | 'fleet'
  | 'bus'
  | 'parcel'
  | 'attendance'
  | 'incident'
  | 'approvals'       // HOD unified approval queue
  | 'vehicle_request' // Employee vehicle request
  | 'claims'          // Employee TA/DA/Conveyance
  | 'asset'           // Asset Lifecycle Management
  | 'guest';          // Guest & VIP Management

export type Lang = 'en' | 'bn';

export interface ViewProps {
  role: AppRole;
  lang: Lang;
}

export const ROLE_META: Record<AppRole, { label: string; labelBn: string; name: string; dept: string; initials: string; avatarColor: string }> = {
  chairman: {
    label: 'Chairman & Managing Director',
    labelBn: 'চেয়ারম্যান ও ব্যবস্থাপনা পরিচালক',
    name: 'Ahmed Akbar Sobhan',
    dept: "Chairman's Office",
    initials: 'AAS',
    avatarColor: '#A51C30',
  },
  plant_gm: {
    label: 'Plant General Manager',
    labelBn: 'প্ল্যান্ট জেনারেল ম্যানেজার',
    name: 'Engr. Md. Harunur Rashid',
    dept: 'Keraniganj Refinery',
    initials: 'HR',
    avatarColor: '#0369A1',
  },
  hr_admin: {
    label: 'GM, HR & Corporate Services',
    labelBn: 'মহাব্যবস্থাপক, মানবসম্পদ ও প্রশাসন',
    name: 'Sayeda Afroza Sultana',
    dept: 'Human Resources & Corporate Administration',
    initials: 'SAS',
    avatarColor: '#BE185D',
  },
  transport_admin: {
    label: 'Transport & Admin Supervisor',
    labelBn: 'পরিবহন ও প্রশাসন পরিদর্শক',
    name: 'Md. Kamruzzaman',
    dept: 'Admin & Transport Division',
    initials: 'KZ',
    avatarColor: '#059669',
  },
  hod: {
    label: 'Head of Department / Approver',
    labelBn: 'বিভাগীয় প্রধান / অনুমোদনকারী',
    name: 'Farida Begum',
    dept: 'Finance & Accounts Department',
    initials: 'FB',
    avatarColor: '#7C3AED',
  },
  employee: {
    label: 'Staff Self-Service Portal',
    labelBn: 'কর্মচারী সেলফ-সার্ভিস পোর্টাল',
    name: 'Tanvir Ahmed',
    dept: 'Sales & Distribution, Dhaka',
    initials: 'TA',
    avatarColor: '#D97706',
  },
  driver: {
    label: 'Duty Driver Terminal',
    labelBn: 'ডিউটি ড্রাইভার টার্মিনাল',
    name: 'Md. Rafiqul Islam',
    dept: 'Fleet Operations & Heavy Transit',
    initials: 'RI',
    avatarColor: '#059669',
  },
};

export const t = (en: string, bn: string = en, lang: Lang = 'en') => lang === 'bn' ? bn : en;
