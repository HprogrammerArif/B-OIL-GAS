export type AppRole = 'chairman' | 'plant_gm' | 'hr_admin' | 'transport_admin' | 'hod' | 'employee' | 'driver';
export type AppView =
  | 'dashboard'
  | 'inner_circle'    // Leadership Messaging
  | 'workforce'       // Staff Directory & Exit Clearance
  | 'notesheet'       // Official Document Approvals
  | 'compliance'      // Permits & Licenses
  | 'fleet'           // Company Vehicles & Trips
  | 'bus'             // Staff Shuttle Buses
  | 'parcel'          // Office Mail & Parcels
  | 'attendance'      // Daily Attendance & Leave
  | 'incident'        // Safety & Incident Reports
  | 'approvals'       // Pending Approvals Center
  | 'vehicle_request' // Staff Vehicle Booking
  | 'claims'          // Expense & Travel Claims
  | 'asset'           // Company Assets & Equipment
  | 'guest';          // Visitor Gate Passes

export type Lang = 'en' | 'bn';

export interface ViewProps {
  role: AppRole;
  lang: Lang;
  onNavigate?: (view: AppView) => void;
}

export interface RoleMetaItem {
  empId: string;
  label: string;
  labelBn: string;
  name: string;
  nameBn: string;
  shortName: string;
  dept: string;
  deptBn: string;
  email: string;
  phone: string;
  site: 'HQ_BARIDHARA' | 'PLANT_KERANIGANJ' | 'TERMINAL_CTG';
  siteLabel: string;
  siteLabelBn: string;
  bloodGroup: string;
  initials: string;
  avatarColor: string;
}

export const SYSTEM_TODAY = '29 Oct 2026';

export const ROLE_META: Record<AppRole, RoleMetaItem> = {
  chairman: {
    empId: 'EMP-0001',
    label: 'Chairman & Managing Director',
    labelBn: 'চেয়ারম্যান ও ব্যবস্থাপনা পরিচালক',
    name: 'Ahmed Akbar Sobhan',
    nameBn: 'আহমেদ আকবর সোবহান',
    shortName: 'Ahmed',
    dept: "Chairman's Office",
    deptBn: 'চেয়ারম্যানের কার্যালয়',
    email: 'chairman@bashundhara.com',
    phone: '+880 1711-000001',
    site: 'HQ_BARIDHARA',
    siteLabel: 'Head Office, Baridhara',
    siteLabelBn: 'প্রধান কার্যালয়, বারিধারা',
    bloodGroup: 'B+',
    initials: 'AAS',
    avatarColor: '#A51C30',
  },
  plant_gm: {
    empId: 'EMP-0012',
    label: 'Plant General Manager',
    labelBn: 'প্ল্যান্ট জেনারেল ম্যানেজার',
    name: 'Engr. Md. Harunur Rashid',
    nameBn: 'প্রকৌ. মোঃ হারুনুর রশীদ',
    shortName: 'Harunur',
    dept: 'Plant Operations',
    deptBn: 'প্ল্যান্ট অপারেশনস',
    email: 'gm.plant@bashundhara.com',
    phone: '+880 1713-441199',
    site: 'PLANT_KERANIGANJ',
    siteLabel: 'Keraniganj Plant',
    siteLabelBn: 'কেরানীগঞ্জ প্ল্যান্ট',
    bloodGroup: 'O+',
    initials: 'HR',
    avatarColor: '#0369A1',
  },
  hr_admin: {
    empId: 'EMP-0028',
    label: 'GM, HR & Administration',
    labelBn: 'মহাব্যবস্থাপক, মানবসম্পদ ও প্রশাসন',
    name: 'Sayeda Afroza Sultana',
    nameBn: 'সৈয়দা আফরোজা সুলতানা',
    shortName: 'Afroza',
    dept: 'Human Resources',
    deptBn: 'মানবসম্পদ ও প্রশাসন',
    email: 'hr.gm@bashundhara.com',
    phone: '+880 1714-882200',
    site: 'HQ_BARIDHARA',
    siteLabel: 'Head Office, Baridhara',
    siteLabelBn: 'প্রধান কার্যালয়, বারিধারা',
    bloodGroup: 'A+',
    initials: 'SAS',
    avatarColor: '#BE185D',
  },
  transport_admin: {
    empId: 'EMP-0045',
    label: 'Transport & Admin Supervisor',
    labelBn: 'পরিবহন ও প্রশাসন তত্ত্বাবধায়ক',
    name: 'Md. Kamruzzaman',
    nameBn: 'মোঃ কামরুজ্জামান',
    shortName: 'Kamruzzaman',
    dept: 'Transport & Logistics',
    deptBn: 'পরিবহন ও লজিস্টিক্স',
    email: 'transport.admin@bashundhara.com',
    phone: '+880 1712-990011',
    site: 'PLANT_KERANIGANJ',
    siteLabel: 'Keraniganj Plant',
    siteLabelBn: 'কেরানীগঞ্জ প্ল্যান্ট',
    bloodGroup: 'B+',
    initials: 'KZ',
    avatarColor: '#059669',
  },
  hod: {
    empId: 'EMP-0062',
    label: 'Head of Finance & Approver',
    labelBn: 'প্রধান অর্থ কর্মকর্তা ও অনুমোদনকারী',
    name: 'Farida Begum',
    nameBn: 'ফরিদা বেগম',
    shortName: 'Farida',
    dept: 'Finance & Accounts',
    deptBn: 'অর্থ ও হিসাব বিভাগ',
    email: 'farida.finance@bashundhara.com',
    phone: '+880 1819-223344',
    site: 'HQ_BARIDHARA',
    siteLabel: 'Head Office, Baridhara',
    siteLabelBn: 'প্রধান কার্যালয়, বারিধারা',
    bloodGroup: 'AB+',
    initials: 'FB',
    avatarColor: '#7C3AED',
  },
  employee: {
    empId: 'EMP-1042',
    label: 'Senior Sales Officer',
    labelBn: 'সিনিয়র সেলস অফিসার',
    name: 'Tanvir Ahmed',
    nameBn: 'তানভীর আহমেদ',
    shortName: 'Tanvir',
    dept: 'Sales & Distribution',
    deptBn: 'বিক্রয় ও বিতরণ বিভাগ',
    email: 'tanvir.sales@bashundhara.com',
    phone: '+880 1712-334455',
    site: 'HQ_BARIDHARA',
    siteLabel: 'Head Office, Baridhara',
    siteLabelBn: 'প্রধান কার্যালয়, বারিধারা',
    bloodGroup: 'O+',
    initials: 'TA',
    avatarColor: '#D97706',
  },
  driver: {
    empId: 'EMP-0821',
    label: 'Senior Company Driver',
    labelBn: 'সিনিয়র কোম্পানি ড্রাইভার',
    name: 'Md. Rafiqul Islam',
    nameBn: 'মোঃ রফিকুল ইসলাম',
    shortName: 'Rafiqul',
    dept: 'Transport & Logistics',
    deptBn: 'পরিবহন ও লজিস্টিক্স',
    email: 'rafiqul.driver@bashundhara.com',
    phone: '+880 1715-882100',
    site: 'HQ_BARIDHARA',
    siteLabel: 'Head Office, Baridhara',
    siteLabelBn: 'প্রধান কার্যালয়, বারিধারা',
    bloodGroup: 'B+',
    initials: 'RI',
    avatarColor: '#059669',
  },
};

const HONORIFIC_PREFIXES = new Set([
  'md.', 'md', 'engr.', 'engr', 'dr.', 'dr', 'sayeda', 'adv.', 'adv',
  'mr.', 'mr', 'mrs.', 'mrs', 'ms.', 'ms', 'lt.', 'lt', 'col.', 'col',
  'major', '(retd.)', 'master', 's.m.', 's.', 'm.',
]);

export function getShortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const meaningful = parts.find((p) => !HONORIFIC_PREFIXES.has(p.toLowerCase()));
  return meaningful || parts[0] || fullName;
}

export const t = (en: string, bn: string = en, lang: Lang = 'en') => (lang === 'bn' ? bn : en);
