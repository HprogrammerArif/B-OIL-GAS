import type { DepartmentRef, RoleKey, SiteRef } from "@/types/domain/identity";
import type { MockEmployee, MockUser } from "../db/schema";

/** SHA-256 of the shared demo credential used by the web prototype (`client/src/auth/session.ts`). */
export const DEMO_PASSWORD_SHA256 = "95665bd975b309827cbc17b25a0776ba447701bd70909ae63ba8da93560de34d";

export const SITES: SiteRef[] = [
  { id: "site_hq", code: "HQ_BARIDHARA", name: "Head Office, Baridhara", nameBn: "প্রধান কার্যালয়, বারিধারা" },
  { id: "site_plant", code: "PLANT_KERANIGANJ", name: "Keraniganj Plant", nameBn: "কেরানীগঞ্জ প্ল্যান্ট" },
  { id: "site_ctg", code: "TERMINAL_CTG", name: "Chattogram Terminal", nameBn: "চট্টগ্রাম টার্মিনাল" },
];

export const DEPARTMENTS: DepartmentRef[] = [
  { id: "dept_exec", code: "EXEC", name: "Chairman's Office", nameBn: "চেয়ারম্যানের কার্যালয়" },
  { id: "dept_plant", code: "PLANT", name: "Plant Operations", nameBn: "প্ল্যান্ট অপারেশনস" },
  { id: "dept_sales", code: "SALES", name: "Sales & Distribution", nameBn: "বিক্রয় ও বিতরণ বিভাগ" },
  { id: "dept_fin", code: "FIN", name: "Finance & Accounts", nameBn: "অর্থ ও হিসাব বিভাগ" },
  { id: "dept_trans", code: "TRANS", name: "Transport & Logistics", nameBn: "পরিবহন ও লজিস্টিক্স" },
  { id: "dept_hse", code: "HSE", name: "HSE & Compliance", nameBn: "এইচএসই ও কমপ্লায়েন্স" },
  { id: "dept_hr", code: "HR", name: "Human Resources", nameBn: "মানবসম্পদ ও প্রশাসন" },
  { id: "dept_sec", code: "SEC", name: "Security Administration", nameBn: "নিরাপত্তা প্রশাসন" },
];

interface PersonSeed {
  code: string;
  pernr: string;
  name: string;
  nameBn: string;
  shortName: string;
  initials: string;
  email: string;
  phone: string;
  dept: string;
  site: string;
  title: string;
  titleBn: string;
  grade: [string, string];
  manager: string | null;
  joinDate: string;
  status: MockEmployee["status"];
  color: string;
  nid: string;
  blood: string;
  emergency: string;
  roles?: RoleKey[];
  exit?: { date: string; reason: string; clearedBy: string; clearedAt: string; notes: string };
}

const PEOPLE: PersonSeed[] = [
  {
    code: "EMP-0001", pernr: "PR-10001", name: "Ahmed Akbar Sobhan", nameBn: "আহমেদ আকবর সোবহান", shortName: "Ahmed",
    initials: "AAS", email: "chairman@bashundhara.com", phone: "+880 1711-000001", dept: "dept_exec", site: "site_hq",
    title: "Chairman & Managing Director", titleBn: "চেয়ারম্যান ও ব্যবস্থাপনা পরিচালক", grade: ["E10", "Board"],
    manager: null, joinDate: "1987-01-01", status: "ACTIVE", color: "#A51C30", nid: "1962269201928001", blood: "B+",
    emergency: "+880 1711-999999 (Chairman Office)", roles: ["CHAIRMAN"],
  },
  {
    code: "EMP-0012", pernr: "PR-20412", name: "Engr. Md. Harunur Rashid", nameBn: "প্রকৌ. মোঃ হারুনুর রশীদ", shortName: "Harunur",
    initials: "HR", email: "gm.plant@bashundhara.com", phone: "+880 1713-441199", dept: "dept_plant", site: "site_plant",
    title: "Plant General Manager", titleBn: "প্ল্যান্ট জেনারেল ম্যানেজার", grade: ["E8", "General Manager"],
    manager: "EMP-0001", joinDate: "2018-03-15", status: "ACTIVE", color: "#0369A1", nid: "1974269201928012", blood: "O+",
    emergency: "+880 1711-223344 (Spouse)", roles: ["PLANT_GM", "HSE_OFFICER"],
  },
  {
    code: "EMP-0028", pernr: "PR-30114", name: "Sayeda Afroza Sultana", nameBn: "সৈয়দা আফরোজা সুলতানা", shortName: "Afroza",
    initials: "SAS", email: "hr.gm@bashundhara.com", phone: "+880 1714-882200", dept: "dept_hr", site: "site_hq",
    title: "GM, HR & Administration", titleBn: "মহাব্যবস্থাপক, মানবসম্পদ ও প্রশাসন", grade: ["E8", "General Manager"],
    manager: "EMP-0001", joinDate: "2019-09-01", status: "ACTIVE", color: "#BE185D", nid: "1979269201928028", blood: "A+",
    emergency: "+880 1819-554433 (Family)", roles: ["HR_ADMIN"],
  },
  {
    code: "EMP-0045", pernr: "PR-40892", name: "Md. Kamruzzaman", nameBn: "মোঃ কামরুজ্জামান", shortName: "Kamruzzaman",
    initials: "KZ", email: "transport.admin@bashundhara.com", phone: "+880 1712-990011", dept: "dept_trans", site: "site_plant",
    title: "Transport & Admin Supervisor", titleBn: "পরিবহন ও প্রশাসন তত্ত্বাবধায়ক", grade: ["M3", "Supervisor"],
    manager: "EMP-0028", joinDate: "2020-02-10", status: "ACTIVE", color: "#059669", nid: "1982269201928045", blood: "B+",
    emergency: "+880 1912-334455 (Brother)", roles: ["TRANSPORT_ADMIN", "SECURITY_GATE", "MAILROOM"],
  },
  {
    code: "EMP-0062", pernr: "PR-50119", name: "Farida Begum", nameBn: "ফরিদা বেগম", shortName: "Farida",
    initials: "FB", email: "farida.finance@bashundhara.com", phone: "+880 1819-223344", dept: "dept_fin", site: "site_hq",
    title: "Head of Finance & Approver", titleBn: "প্রধান অর্থ কর্মকর্তা ও অনুমোদনকারী", grade: ["E7", "Head of Department"],
    manager: "EMP-0001", joinDate: "2021-01-12", status: "ACTIVE", color: "#7C3AED", nid: "1980269201928062", blood: "AB+",
    emergency: "+880 1715-667788 (Spouse)", roles: ["HOD", "FINANCE"],
  },
  {
    code: "EMP-1042", pernr: "PR-60912", name: "Tanvir Ahmed", nameBn: "তানভীর আহমেদ", shortName: "Tanvir",
    initials: "TA", email: "tanvir.sales@bashundhara.com", phone: "+880 1712-334455", dept: "dept_sales", site: "site_hq",
    title: "Senior Sales Officer", titleBn: "সিনিয়র সেলস অফিসার", grade: ["O4", "Senior Officer"],
    manager: "EMP-0062", joinDate: "2022-06-01", status: "ACTIVE", color: "#D97706", nid: "1990269201921042", blood: "O+",
    emergency: "+880 1712-887766 (Brother)", roles: ["EMPLOYEE"],
  },
  {
    code: "EMP-0821", pernr: "PR-54821", name: "Md. Rafiqul Islam", nameBn: "মোঃ রফিকুল ইসলাম", shortName: "Rafiqul",
    initials: "RI", email: "rafiqul.driver@bashundhara.com", phone: "+880 1715-882100", dept: "dept_trans", site: "site_hq",
    title: "Senior Company Driver", titleBn: "সিনিয়র কোম্পানি ড্রাইভার", grade: ["S2", "Staff"],
    manager: "EMP-0045", joinDate: "2019-05-14", status: "ACTIVE", color: "#059669", nid: "1986269201920821", blood: "B+",
    emergency: "+880 1718-994422 (Spouse)", roles: ["DRIVER"],
  },
  {
    code: "EMP-1088", pernr: "PR-61204", name: "Engr. Tariqul Islam", nameBn: "প্রকৌ. তরিকুল ইসলাম", shortName: "Tariqul",
    initials: "TI", email: "tariq.plant@bashundhara.com", phone: "+880 1819-445566", dept: "dept_plant", site: "site_plant",
    title: "Senior Plant Maintenance Engineer", titleBn: "সিনিয়র প্ল্যান্ট মেইনটেন্যান্স প্রকৌশলী", grade: ["O5", "Engineer"],
    manager: "EMP-0012", joinDate: "2021-08-15", status: "ON_LEAVE", color: "#0284C7", nid: "1988269201921088", blood: "A+",
    emergency: "+880 1911-332211 (Father)",
  },
  {
    code: "EMP-1104", pernr: "PR-62340", name: "Nazmul Huda", nameBn: "নাজমুল হুদা", shortName: "Nazmul",
    initials: "NH", email: "nazmul.safety@bashundhara.com", phone: "+880 1914-778899", dept: "dept_hse", site: "site_plant",
    title: "Senior Safety & Environment Officer", titleBn: "সিনিয়র নিরাপত্তা ও পরিবেশ কর্মকর্তা", grade: ["O4", "Senior Officer"],
    manager: "EMP-0012", joinDate: "2023-01-05", status: "ACTIVE", color: "#16A34A", nid: "1992269201921104", blood: "B+",
    emergency: "+880 1819-998877 (Mother)",
  },
  {
    code: "EMP-0914", pernr: "PR-58410", name: "Mizanur Rahman", nameBn: "মিজানুর রহমান", shortName: "Mizanur",
    initials: "MR", email: "mizanur.sec@bashundhara.com", phone: "+880 1715-661122", dept: "dept_sec", site: "site_plant",
    title: "Main Gate & Security Officer", titleBn: "প্রধান গেট ও নিরাপত্তা কর্মকর্তা", grade: ["O3", "Officer"],
    manager: "EMP-0045", joinDate: "2021-07-20", status: "ACTIVE", color: "#475569", nid: "1985269201920914", blood: "O+",
    emergency: "+880 1711-445566 (Wife)",
  },
  {
    code: "EMP-0733", pernr: "PR-57733", name: "Md. Rahim Uddin", nameBn: "মোঃ রহিম উদ্দিন", shortName: "Rahim",
    initials: "RU", email: "rahim.accounts@bashundhara.com", phone: "+880 1716-553311", dept: "dept_fin", site: "site_hq",
    title: "Senior Accounts Executive", titleBn: "সিনিয়র হিসাব নির্বাহী", grade: ["O4", "Senior Officer"],
    manager: "EMP-0062", joinDate: "2020-04-12", status: "ON_LEAVE", color: "#0F766E", nid: "1987269201920733", blood: "A-",
    emergency: "+880 1911-552244 (Wife)",
  },
  {
    code: "EMP-0782", pernr: "PR-51209", name: "Shakil Ahmed", nameBn: "শাকিল আহমেদ", shortName: "Shakil",
    initials: "SA", email: "shakil.proc@bashundhara.com", phone: "+880 1718-332211", dept: "dept_fin", site: "site_hq",
    title: "Assistant Manager (Accounts & Billing)", titleBn: "সহকারী ব্যবস্থাপক (হিসাব ও বিলিং)", grade: ["M1", "Assistant Manager"],
    manager: "EMP-0062", joinDate: "2021-02-10", status: "OFFBOARDED", color: "#94A3B8", nid: "1991269201920782", blood: "A+",
    emergency: "+880 1819-221100",
    exit: {
      date: "2026-09-15", reason: "Joined a private consulting firm. Full handover and clearance completed.",
      clearedBy: "Sayeda Afroza Sultana (GM, HR & Administration)", clearedAt: "2026-09-15T10:30:00.000Z",
      notes: "Final salary & dues settled (Voucher #FS-2026-089). Laptop and ID card returned.",
    },
  },
  {
    code: "EMP-0640", pernr: "PR-48902", name: "Khadija Akhter", nameBn: "খাদিজা আক্তার", shortName: "Khadija",
    initials: "KA", email: "khadija.lab@bashundhara.com", phone: "+880 1719-887766", dept: "dept_plant", site: "site_plant",
    title: "Quality Testing Officer", titleBn: "মান নিয়ন্ত্রণ কর্মকর্তা", grade: ["O3", "Officer"],
    manager: "EMP-0012", joinDate: "2020-11-01", status: "OFFBOARDED", color: "#94A3B8", nid: "1993269201920640", blood: "B+",
    emergency: "+880 1711-665544",
    exit: {
      date: "2026-08-30", reason: "Moved abroad for higher education.",
      clearedBy: "Engr. Md. Harunur Rashid (Plant GM)", clearedAt: "2026-08-30T11:00:00.000Z",
      notes: "Lab locker keys, gate pass, and testing equipment returned in good condition.",
    },
  },
];

export const empId = (code: string) => `emp_${code.slice(4)}`;
export const userId = (code: string) => `usr_${code.slice(4)}`;

export function normalisePhone(phone: string): string {
  return phone.replace(/[\s-]/g, "");
}

export function buildPeople(): { employees: MockEmployee[]; users: MockUser[] } {
  const byCode = new Map(PEOPLE.map((p) => [p.code, p]));
  const employees: MockEmployee[] = PEOPLE.map((p) => {
    const dept = DEPARTMENTS.find((d) => d.id === p.dept) ?? DEPARTMENTS[0]!;
    const site = SITES.find((s) => s.id === p.site) ?? SITES[0]!;
    const manager = p.manager ? byCode.get(p.manager) : undefined;
    return {
      id: empId(p.code),
      userId: p.roles ? userId(p.code) : null,
      empCode: p.code,
      sapPernr: p.pernr,
      fullName: p.name,
      fullNameBn: p.nameBn,
      shortName: p.shortName,
      initials: p.initials,
      email: p.email,
      phone: p.phone,
      designation: { id: `dsg_${p.code.slice(4)}`, title: p.title, titleBn: p.titleBn },
      grade: { id: `grd_${p.grade[0]}`, code: p.grade[0], name: p.grade[1] },
      department: dept,
      site,
      lineManager: manager ? { id: empId(manager.code), fullName: manager.name } : null,
      joinDate: p.joinDate,
      status: p.status,
      bloodGroup: p.blood,
      avatarColor: p.color,
      nationalId: p.nid,
      emergencyContact: p.emergency,
      exitDate: p.exit?.date ?? null,
      exitReason: p.exit?.reason ?? null,
      clearance: p.exit
        ? {
            itAccessRevoked: true,
            rfidGateBadgeSurrendered: true,
            vehicleFuelCardReturned: true,
            financeAccountsSettled: true,
            clearedBy: p.exit.clearedBy,
            clearedAt: p.exit.clearedAt,
            notes: p.exit.notes,
          }
        : null,
    };
  });

  const users: MockUser[] = PEOPLE.filter((p) => p.roles).map((p) => ({
    id: userId(p.code),
    email: p.email,
    phone: normalisePhone(p.phone),
    employeeId: empId(p.code),
    roles: p.roles ?? ["EMPLOYEE"],
    passwordDigest: DEMO_PASSWORD_SHA256,
    preferredLang: "EN",
    mfaEnabled: false,
    lastLoginAt: null,
    failedAttempts: 0,
    lockedUntil: null,
    isActive: true,
  }));

  return { employees, users };
}

/** Persona shortcuts for the presenter panel (mock mode only). */
export const PERSONAS: { code: string; roleLabel: string; roleLabelBn: string }[] = [
  { code: "EMP-0001", roleLabel: "Chairman", roleLabelBn: "চেয়ারম্যান" },
  { code: "EMP-0012", roleLabel: "Plant GM", roleLabelBn: "প্ল্যান্ট জিএম" },
  { code: "EMP-0028", roleLabel: "HR Admin", roleLabelBn: "এইচআর অ্যাডমিন" },
  { code: "EMP-0045", roleLabel: "Transport", roleLabelBn: "পরিবহন" },
  { code: "EMP-0062", roleLabel: "HOD Finance", roleLabelBn: "বিভাগীয় প্রধান" },
  { code: "EMP-1042", roleLabel: "Employee", roleLabelBn: "কর্মচারী" },
  { code: "EMP-0821", roleLabel: "Driver", roleLabelBn: "চালক" },
];
