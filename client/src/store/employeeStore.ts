import { useState, useEffect } from 'react';
import { AppRole, SYSTEM_TODAY } from '../types';

export interface ExitClearance {
  itAccessRevoked: boolean;
  rfidGateBadgeSurrendered: boolean;
  vehicleFuelCardReturned: boolean;
  financeAccountsSettled: boolean;
  clearedBy?: string;
  clearedAt?: string;
  notes?: string;
}

export interface Employee {
  id: string; // e.g. EMP-1042
  sapPernr: string; // Payroll Reference No e.g. PR-60912
  name: string;
  nameBn?: string;
  email: string;
  phone: string;
  dept:
    | 'Executive'
    | 'Plant Operations'
    | 'Sales & Distribution'
    | 'Finance & Accounts'
    | 'Transport & Logistics'
    | 'HSE & Compliance'
    | 'Human Resources'
    | 'Security Administration';
  designation: string;
  designationBn?: string;
  role: AppRole;
  assignedSite: 'PLANT_KERANIGANJ' | 'HQ_BARIDHARA' | 'TERMINAL_CTG';
  reportingHOD: string;
  status: 'active' | 'on_leave' | 'offboarded';
  joinDate: string;
  exitDate?: string;
  exitReason?: string;
  avatarColor: string;
  initials: string;
  nationalId: string;
  bloodGroup: string;
  emergencyContact: string;
  clearance?: ExitClearance;
}

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'EMP-0001',
    sapPernr: 'PR-10001',
    name: 'Ahmed Akbar Sobhan',
    nameBn: 'আহমেদ আকবর সোবহান',
    email: 'chairman@bashundhara.com',
    phone: '+880 1711-000001',
    dept: 'Executive',
    designation: 'Chairman & Managing Director',
    designationBn: 'চেয়ারম্যান ও ব্যবস্থাপনা পরিচালক',
    role: 'chairman',
    assignedSite: 'HQ_BARIDHARA',
    reportingHOD: 'Board of Directors',
    status: 'active',
    joinDate: '01 Jan 1987',
    avatarColor: '#A51C30',
    initials: 'AAS',
    nationalId: '1962269201928001',
    bloodGroup: 'B+',
    emergencyContact: '+880 1711-999999 (Chairman Office)',
  },
  {
    id: 'EMP-0012',
    sapPernr: 'PR-20412',
    name: 'Engr. Md. Harunur Rashid',
    nameBn: 'প্রকৌ. মোঃ হারুনুর রশীদ',
    email: 'gm.plant@bashundhara.com',
    phone: '+880 1713-441199',
    dept: 'Plant Operations',
    designation: 'Plant General Manager',
    designationBn: 'প্ল্যান্ট জেনারেল ম্যানেজার',
    role: 'plant_gm',
    assignedSite: 'PLANT_KERANIGANJ',
    reportingHOD: 'EMP-0001',
    status: 'active',
    joinDate: '15 Mar 2018',
    avatarColor: '#0369A1',
    initials: 'HR',
    nationalId: '1974269201928012',
    bloodGroup: 'O+',
    emergencyContact: '+880 1711-223344 (Spouse)',
  },
  {
    id: 'EMP-0028',
    sapPernr: 'PR-30114',
    name: 'Sayeda Afroza Sultana',
    nameBn: 'সৈয়দা আফরোজা সুলতানা',
    email: 'hr.gm@bashundhara.com',
    phone: '+880 1714-882200',
    dept: 'Human Resources',
    designation: 'GM, HR & Administration',
    designationBn: 'মহাব্যবস্থাপক, মানবসম্পদ ও প্রশাসন',
    role: 'hr_admin',
    assignedSite: 'HQ_BARIDHARA',
    reportingHOD: 'EMP-0001',
    status: 'active',
    joinDate: '01 Sep 2019',
    avatarColor: '#BE185D',
    initials: 'SAS',
    nationalId: '1979269201928028',
    bloodGroup: 'A+',
    emergencyContact: '+880 1819-554433 (Family)',
  },
  {
    id: 'EMP-0045',
    sapPernr: 'PR-40892',
    name: 'Md. Kamruzzaman',
    nameBn: 'মোঃ কামরুজ্জামান',
    email: 'transport.admin@bashundhara.com',
    phone: '+880 1712-990011',
    dept: 'Transport & Logistics',
    designation: 'Transport & Admin Supervisor',
    designationBn: 'পরিবহন ও প্রশাসন তত্ত্বাবধায়ক',
    role: 'transport_admin',
    assignedSite: 'PLANT_KERANIGANJ',
    reportingHOD: 'EMP-0028',
    status: 'active',
    joinDate: '10 Feb 2020',
    avatarColor: '#059669',
    initials: 'KZ',
    nationalId: '1982269201928045',
    bloodGroup: 'B+',
    emergencyContact: '+880 1912-334455 (Brother)',
  },
  {
    id: 'EMP-0062',
    sapPernr: 'PR-50119',
    name: 'Farida Begum',
    nameBn: 'ফরিদা বেগম',
    email: 'farida.finance@bashundhara.com',
    phone: '+880 1819-223344',
    dept: 'Finance & Accounts',
    designation: 'Head of Finance & Approver',
    designationBn: 'প্রধান অর্থ কর্মকর্তা ও অনুমোদনকারী',
    role: 'hod',
    assignedSite: 'HQ_BARIDHARA',
    reportingHOD: 'EMP-0001',
    status: 'active',
    joinDate: '12 Jan 2021',
    avatarColor: '#7C3AED',
    initials: 'FB',
    nationalId: '1980269201928062',
    bloodGroup: 'AB+',
    emergencyContact: '+880 1715-667788 (Spouse)',
  },
  {
    id: 'EMP-1042',
    sapPernr: 'PR-60912',
    name: 'Tanvir Ahmed',
    nameBn: 'তানভীর আহমেদ',
    email: 'tanvir.sales@bashundhara.com',
    phone: '+880 1712-334455',
    dept: 'Sales & Distribution',
    designation: 'Senior Sales Officer',
    designationBn: 'সিনিয়র সেলস অফিসার',
    role: 'employee',
    assignedSite: 'HQ_BARIDHARA',
    reportingHOD: 'EMP-0062',
    status: 'active',
    joinDate: '01 Jun 2022',
    avatarColor: '#D97706',
    initials: 'TA',
    nationalId: '1990269201921042',
    bloodGroup: 'O+',
    emergencyContact: '+880 1712-887766 (Brother)',
  },
  {
    id: 'EMP-0821',
    sapPernr: 'PR-54821',
    name: 'Md. Rafiqul Islam',
    nameBn: 'মোঃ রফিকুল ইসলাম',
    email: 'rafiqul.driver@bashundhara.com',
    phone: '+880 1715-882100',
    dept: 'Transport & Logistics',
    designation: 'Senior Company Driver',
    designationBn: 'সিনিয়র কোম্পানি ড্রাইভার',
    role: 'driver',
    assignedSite: 'HQ_BARIDHARA',
    reportingHOD: 'EMP-0045',
    status: 'active',
    joinDate: '14 May 2019',
    avatarColor: '#059669',
    initials: 'RI',
    nationalId: '1986269201920821',
    bloodGroup: 'B+',
    emergencyContact: '+880 1718-994422 (Spouse)',
  },
  {
    id: 'EMP-1088',
    sapPernr: 'PR-61204',
    name: 'Engr. Tariqul Islam',
    nameBn: 'প্রকৌ. তরিকুল ইসলাম',
    email: 'tariq.plant@bashundhara.com',
    phone: '+880 1819-445566',
    dept: 'Plant Operations',
    designation: 'Senior Plant Maintenance Engineer',
    designationBn: 'সিনিয়র প্ল্যান্ট মেইনটেন্যান্স প্রকৌশলী',
    role: 'employee',
    assignedSite: 'PLANT_KERANIGANJ',
    reportingHOD: 'EMP-0012',
    status: 'on_leave',
    joinDate: '15 Aug 2021',
    avatarColor: '#0284C7',
    initials: 'TI',
    nationalId: '1988269201921088',
    bloodGroup: 'A+',
    emergencyContact: '+880 1911-332211 (Father)',
  },
  {
    id: 'EMP-1104',
    sapPernr: 'PR-62340',
    name: 'Nazmul Huda',
    nameBn: 'নাজমুল হুদা',
    email: 'nazmul.safety@bashundhara.com',
    phone: '+880 1914-778899',
    dept: 'HSE & Compliance',
    designation: 'Senior Safety & Environment Officer',
    designationBn: 'সিনিয়র নিরাপত্তা ও পরিবেশ কর্মকর্তা',
    role: 'employee',
    assignedSite: 'PLANT_KERANIGANJ',
    reportingHOD: 'EMP-0012',
    status: 'active',
    joinDate: '05 Jan 2023',
    avatarColor: '#16A34A',
    initials: 'NH',
    nationalId: '1992269201921104',
    bloodGroup: 'B+',
    emergencyContact: '+880 1819-998877 (Mother)',
  },
  {
    id: 'EMP-0914',
    sapPernr: 'PR-58410',
    name: 'Mizanur Rahman',
    nameBn: 'মিজানুর রহমান',
    email: 'mizanur.sec@bashundhara.com',
    phone: '+880 1715-661122',
    dept: 'Security Administration',
    designation: 'Main Gate & Security Officer',
    designationBn: 'প্রধান গেট ও নিরাপত্তা কর্মকর্তা',
    role: 'employee',
    assignedSite: 'PLANT_KERANIGANJ',
    reportingHOD: 'EMP-0045',
    status: 'active',
    joinDate: '20 Jul 2021',
    avatarColor: '#475569',
    initials: 'MR',
    nationalId: '1985269201920914',
    bloodGroup: 'O+',
    emergencyContact: '+880 1711-445566 (Wife)',
  },
  {
    id: 'EMP-0782',
    sapPernr: 'PR-51209',
    name: 'Shakil Ahmed',
    nameBn: 'শাকিল আহমেদ',
    email: 'shakil.proc@bashundhara.com',
    phone: '+880 1718-332211',
    dept: 'Finance & Accounts',
    designation: 'Assistant Manager (Accounts & Billing)',
    designationBn: 'সহকারী ব্যবস্থাপক (হিসাব ও বিলিং)',
    role: 'employee',
    assignedSite: 'HQ_BARIDHARA',
    reportingHOD: 'EMP-0062',
    status: 'offboarded',
    joinDate: '10 Feb 2021',
    exitDate: '15 Sep 2026',
    exitReason: 'Joined a private consulting firm. Full handover and clearance completed.',
    avatarColor: '#94A3B8',
    initials: 'SA',
    nationalId: '1991269201920782',
    bloodGroup: 'A+',
    emergencyContact: '+880 1819-221100',
    clearance: {
      itAccessRevoked: true,
      rfidGateBadgeSurrendered: true,
      vehicleFuelCardReturned: true,
      financeAccountsSettled: true,
      clearedBy: 'Sayeda Afroza Sultana (GM, HR & Administration)',
      clearedAt: '15 Sep 2026, 04:30 PM',
      notes: 'Final salary & dues settled (Voucher #FS-2026-089). Laptop and ID card returned.',
    },
  },
  {
    id: 'EMP-0640',
    sapPernr: 'PR-48902',
    name: 'Khadija Akhter',
    nameBn: 'খাদিজা আক্তার',
    email: 'khadija.lab@bashundhara.com',
    phone: '+880 1719-887766',
    dept: 'Plant Operations',
    designation: 'Quality Testing Officer',
    designationBn: 'মান নিয়ন্ত্রণ কর্মকর্তা',
    role: 'employee',
    assignedSite: 'PLANT_KERANIGANJ',
    reportingHOD: 'EMP-0012',
    status: 'offboarded',
    joinDate: '01 Nov 2020',
    exitDate: '30 Aug 2026',
    exitReason: 'Moved abroad for higher education.',
    avatarColor: '#94A3B8',
    initials: 'KA',
    nationalId: '1993269201920640',
    bloodGroup: 'B+',
    emergencyContact: '+880 1711-665544',
    clearance: {
      itAccessRevoked: true,
      rfidGateBadgeSurrendered: true,
      vehicleFuelCardReturned: true,
      financeAccountsSettled: true,
      clearedBy: 'Engr. Md. Harunur Rashid (Plant GM)',
      clearedAt: '30 Aug 2026, 05:00 PM',
      notes: 'Lab locker keys, gate pass, and testing equipment returned in good condition.',
    },
  },
];

let globalEmployees = [...INITIAL_EMPLOYEES];
let listeners: Array<() => void> = [];

const notify = () => listeners.forEach((l) => l());

export function getEmployeesSnapshot(): Employee[] {
  return globalEmployees;
}

export function resolveManagerName(hodRef: string): string {
  if (!hodRef || hodRef === 'Self' || hodRef === 'Board of Directors') return 'Board of Directors';
  const found = globalEmployees.find((e) => e.id === hodRef);
  return found ? `${found.name} (${found.id})` : hodRef;
}

export function useEmployeeStore() {
  const [employees, setEmployees] = useState<Employee[]>(globalEmployees);

  useEffect(() => {
    const listener = () => setEmployees([...globalEmployees]);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const addEmployee = (data: Omit<Employee, 'id' | 'status' | 'joinDate' | 'initials'>) => {
    const nextSeq = globalEmployees.length + 1100;
    const newId = `EMP-${String(nextSeq).padStart(4, '0')}`;
    const initials =
      data.name
        .split(' ')
        .filter((n) => !['Md.', 'Engr.', 'Dr.', 'Sayeda', 'Mrs.', 'Mr.'].includes(n))
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'EM';

    const newEmp: Employee = {
      ...data,
      id: newId,
      status: 'active',
      joinDate: SYSTEM_TODAY,
      initials,
    };

    globalEmployees = [newEmp, ...globalEmployees];
    notify();
    return newEmp;
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    globalEmployees = globalEmployees.map((e) => (e.id === id ? { ...e, ...updates } : e));
    notify();
  };

  const initiateOffboarding = (id: string, exitDate: string, exitReason: string) => {
    globalEmployees = globalEmployees.map((e) => {
      if (e.id === id) {
        return {
          ...e,
          exitDate: exitDate || e.exitDate || SYSTEM_TODAY,
          exitReason: exitReason || e.exitReason || 'Resignation / Exit in progress',
          clearance: e.clearance || {
            itAccessRevoked: false,
            rfidGateBadgeSurrendered: false,
            vehicleFuelCardReturned: false,
            financeAccountsSettled: false,
          },
        };
      }
      return e;
    });
    notify();
  };

  const updateClearanceItem = (id: string, itemKey: keyof ExitClearance, value: boolean) => {
    globalEmployees = globalEmployees.map((e) => {
      if (e.id === id) {
        const baseClearance: ExitClearance = e.clearance || {
          itAccessRevoked: false,
          rfidGateBadgeSurrendered: false,
          vehicleFuelCardReturned: false,
          financeAccountsSettled: false,
        };
        return {
          ...e,
          clearance: {
            ...baseClearance,
            [itemKey]: value,
          },
        };
      }
      return e;
    });
    notify();
  };

  const finalizeOffboarding = (
    id: string,
    clearedBy: string,
    notes?: string,
    exitDate?: string,
    exitReason?: string
  ) => {
    globalEmployees = globalEmployees.map((e) => {
      if (e.id === id) {
        return {
          ...e,
          status: 'offboarded',
          exitDate: exitDate || e.exitDate || SYSTEM_TODAY,
          exitReason: exitReason || e.exitReason || 'Resignation & exit clearance completed.',
          avatarColor: '#94A3B8',
          clearance: {
            itAccessRevoked: true,
            rfidGateBadgeSurrendered: true,
            vehicleFuelCardReturned: true,
            financeAccountsSettled: true,
            clearedBy,
            clearedAt: `${SYSTEM_TODAY}, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            notes: notes || 'All company equipment returned and final account dues settled by HR.',
          },
        };
      }
      return e;
    });
    notify();
  };

  const reactivateEmployee = (id: string) => {
    globalEmployees = globalEmployees.map((e) => {
      if (e.id === id) {
        return {
          ...e,
          status: 'active',
          exitDate: undefined,
          exitReason: undefined,
          clearance: undefined,
          avatarColor: '#059669',
        };
      }
      return e;
    });
    notify();
  };

  return {
    employees,
    activeEmployees: employees.filter((e) => e.status !== 'offboarded'),
    offboardedEmployees: employees.filter((e) => e.status === 'offboarded'),
    addEmployee,
    updateEmployee,
    initiateOffboarding,
    updateClearanceItem,
    finalizeOffboarding,
    reactivateEmployee,
  };
}
