import type { Priority } from "@/types/domain/common";
import type { NoticeAudienceRef, NoticeCategory } from "@/types/domain/notice";
import { atDay } from "../clock";
import type { MockDb, MockNotice } from "../db/schema";
import { criticalAck, recipientUsers } from "../engine/notices";
import { seedNotification } from "./notifications";
import { empId, userId } from "./org";

interface NoticeSeed {
  no: number;
  title: string;
  titleBn: string;
  body: string;
  bodyBn: string;
  category: NoticeCategory;
  priority: Priority;
  author: string;
  audiences: NoticeAudienceRef[];
  daysAgo: number;
  pinned?: boolean;
  requiresAck?: boolean;
  referenceNo: string;
  /** Organisation-wide totals shown in the prototype (account holders included). */
  totals: { recipients: number; reads: number; acks: number };
  /** Persona employee codes whose receipt starts read / acknowledged; everyone else starts unread. */
  read?: string[];
  acked?: string[];
}

/** Notice board of the web prototype (`client/src/views/dashboard/dashboardData.tsx`) plus its publish templates. */
const SEEDS: NoticeSeed[] = [
  {
    no: 91,
    title: "Chairman's Special Directive — Operational Safety & Discipline Compliance",
    titleBn: "চেয়ারম্যানের বিশেষ নির্দেশনা — নিরাপত্তা ও শৃঙ্খলা বিধান",
    body: "In alignment with Bashundhara Group's zero-incident commitment, all departmental heads, plant managers, and depot supervisors are strictly directed to conduct mandatory safety roll-calls at the start of every shift. Full operational integrity must be maintained across all bitumen refining and logistics assets without compromise.",
    bodyBn: "বসুন্ধরা গ্রুপের জিরো-ইনসিডেন্ট নীতির আলোকে সকল বিভাগীয় প্রধান ও প্ল্যান্ট ম্যানেজারদের প্রতি শিফটে বাধ্যতামূলক নিরাপত্তা ব্রিফিং নিশ্চিত করার কঠোর নির্দেশ দেওয়া হলো।",
    category: "EXECUTIVE", priority: "HIGH", author: "EMP-0001", audiences: [{ type: "ALL", refId: null }],
    daysAgo: 1, pinned: true, requiresAck: true, referenceNo: "BOGCL/CMD/DIR-2026-007",
    totals: { recipients: 1240, reads: 980, acks: 612 },
    read: ["EMP-0028", "EMP-0062", "EMP-0012"], acked: ["EMP-0028", "EMP-0062"],
  },
  {
    no: 89,
    title: "Mandatory Safety Briefing — Q4 Plant Operations",
    titleBn: "বাধ্যতামূলক নিরাপত্তা ব্রিফিং — ৪র্থ প্রান্তিক প্ল্যান্ট অপারেশন",
    body: "All engineering, maintenance, and contractor personnel at Keraniganj Bitumen Refinery must complete the revised LOTO & high-pressure steam line briefing before Oct 20. Zero-tolerance policy strictly enforced across all operational units.",
    bodyBn: "কেরানীগঞ্জ বিটুমিন রিফাইনারির সকল প্রকৌশল, রক্ষণাবেক্ষণ ও ঠিকাদার কর্মীদের ২০ অক্টোবরের মধ্যে সংশোধিত এলওটিও ও হাই-প্রেসার স্টিম লাইন ব্রিফিং সম্পন্ন করতে হবে।",
    category: "SAFETY", priority: "CRITICAL", author: "EMP-0012", audiences: [{ type: "SITE", refId: "site_plant" }],
    daysAgo: 2, pinned: true, requiresAck: true, referenceNo: "BOGCL/HSE/CIR-2026-Q4-019",
    totals: { recipients: 218, reads: 201, acks: 184 },
  },
  {
    no: 90,
    title: "Planned DCS Automation Upgrade & Scheduled Throughput Optimization",
    titleBn: "পরিকল্পিত ডিসিএস অটোমেশন আপগ্রেড ও শিডিউল মেইনটেন্যান্স",
    body: "Scheduled software calibration for DCS Node C-102 will be conducted on Sunday from 02:00 AM to 05:00 AM. Redundant analog safety controllers will remain active throughout the maintenance window.",
    bodyBn: "আগামী রবিবার রাত ২টা থেকে ভোর ৫টা পর্যন্ত ডিসিএস নোড সি-১০২ এর নির্ধারিত সফটওয়্যার ক্যালিব্রেশন অনুষ্ঠিত হবে। এ সময় সহায়ক নিরাপত্তা ব্যবস্থা সক্রিয় থাকবে।",
    category: "OPERATIONS", priority: "NORMAL", author: "EMP-0012", audiences: [{ type: "SITE", refId: "site_plant" }],
    daysAgo: 3, referenceNo: "BOGCL/PLANT/OPS-2026-112",
    totals: { recipients: 218, reads: 150, acks: 0 },
  },
  {
    no: 88,
    title: "HSE Incident Report Submission Deadline Extended",
    titleBn: "এইচএসই ঘটনা প্রতিবেদন জমার সময়সীমা বর্ধিতকরণ",
    body: "Monthly safety observation audits and hazard observation logs for September have been extended until Sunday 5:00 PM due to the continuous bitumen vacuum distillation expansion run.",
    bodyBn: "ধারাবাহিক বিটুমিন ভ্যাকুয়াম ডিস্টিলেশন সম্প্রসারণের কারণে সেপ্টেম্বর মাসের মাসিক নিরাপত্তা পর্যবেক্ষণ অডিট আগামী রবিবার বিকাল ৫টা পর্যন্ত বাড়ানো হয়েছে।",
    category: "OPERATIONS", priority: "NORMAL", author: "EMP-0028", audiences: [{ type: "ROLE", refId: "HOD" }],
    daysAgo: 4, referenceNo: "BOGCL/HSE/NOT-2026-044",
    totals: { recipients: 42, reads: 42, acks: 0 },
    read: ["EMP-0062"],
  },
  {
    no: 87,
    title: "Annual Medical Check-up Camp — All Staff",
    titleBn: "বার্ষিক স্বাস্থ্য পরীক্ষা শিবির — সকল কর্মী",
    body: "Comprehensive occupational health screening, audiometry tests, and respiratory checks will be conducted by Apollo/Evercare medical teams at Baridhara HQ Medical Center and Keraniganj On-site Clinic.",
    bodyBn: "বসুন্ধরা হেড অফিস মেডিকেল সেন্টার এবং কেরানীগঞ্জ অন-সাইট ক্লিনিকে সকল কর্মকর্তা ও কর্মচারীদের জন্য বার্ষিক স্বাস্থ্য পরীক্ষা পরিচালিত হবে।",
    category: "HR", priority: "HIGH", author: "EMP-0028", audiences: [{ type: "ALL", refId: null }],
    daysAgo: 7, requiresAck: true, referenceNo: "BOGCL/HR/MED-2026-012",
    totals: { recipients: 1240, reads: 1102, acks: 890 },
    read: ["EMP-0001", "EMP-0012", "EMP-0045", "EMP-0062", "EMP-1042", "EMP-0821"], acked: ["EMP-0001", "EMP-0012", "EMP-0062"],
  },
  {
    no: 86,
    title: "Corporate Circular — Official Holiday Observation & Essential Operations Roster",
    titleBn: "কর্পোরেট সার্কুলার — সরকারি ছুটির দিন ও জরুরি ডিউটি রোস্টার",
    body: "Head Office and administrative branches will observe holiday closure. Continuous operational units (Refinery DCS, Security, Gate Logistics, and Tank Farm) will operate under standard holiday overtime roster with full safety clearance.",
    bodyBn: "হেড অফিস ও প্রশাসনিক শাখাসমূহ ছুটিতে বন্ধ থাকবে। রিফাইনারি ডিসিএস, নিরাপত্তা ও গেট লজিস্টিকসের মতো জরুরি ইউনিটসমূহ ছুটির ডিউটি রোস্টারে চালু থাকবে।",
    category: "HR", priority: "NORMAL", author: "EMP-0028", audiences: [{ type: "ALL", refId: null }],
    daysAgo: 12, referenceNo: "BOGCL/HR/CIR-2026-031",
    totals: { recipients: 1240, reads: 1180, acks: 0 },
    read: ["EMP-0001", "EMP-0012", "EMP-0045", "EMP-0062", "EMP-1042", "EMP-0821"],
  },
];

function build(db: MockDb, s: NoticeSeed, year: number): MockNotice {
  const authorEmployeeId = empId(s.author);
  const publishAt = atDay(-s.daysAgo, 9, 30);
  const readers = new Set((s.read ?? []).concat(s.acked ?? []).map(userId));
  const ackers = new Set((s.acked ?? []).map(userId));
  const receipts = recipientUsers(db, s.audiences, authorEmployeeId).map((u) => ({
    userId: u.id,
    readAt: readers.has(u.id) ? atDay(-s.daysAgo, 11) : null,
    ackedAt: ackers.has(u.id) ? atDay(-s.daysAgo, 11, 5) : null,
  }));
  const modelledReads = receipts.filter((r) => r.readAt).length;
  const modelledAcks = receipts.filter((r) => r.ackedAt).length;
  return {
    id: `ntc_${year}_${String(s.no).padStart(4, "0")}`,
    refNo: `NOT-${year}-${String(s.no).padStart(4, "0")}`,
    title: s.title,
    titleBn: s.titleBn,
    body: s.body,
    bodyBn: s.bodyBn,
    category: s.category,
    priority: s.priority,
    status: "PUBLISHED",
    isPinned: s.pinned ?? false,
    requiresAck: s.requiresAck ?? false,
    referenceNo: s.referenceNo,
    publishAt,
    expiresAt: null,
    authorEmployeeId,
    createdAt: publishAt,
    audiences: s.audiences,
    receipts,
    offline: {
      recipients: Math.max(s.totals.recipients - receipts.length, 0),
      reads: Math.max(s.totals.reads - modelledReads, 0),
      acks: Math.max(s.totals.acks - modelledAcks, 0),
    },
  };
}

/** Seeds notices with receipts and the matching "new notice" notifications for unread recipients. */
export function seedNotices(db: MockDb): void {
  const year = new Date().getFullYear();
  db.notices = SEEDS.map((s) => build(db, s, year));
  db.counters[`notice:${year}`] = Math.max(...SEEDS.map((s) => s.no));
  for (const n of db.notices) {
    if (n.publishAt === null || Date.parse(n.publishAt) < Date.now() - 5 * 86_400_000) continue;
    for (const r of n.receipts) {
      seedNotification(db, {
        userId: r.userId,
        type: "NOTICE_PUBLISHED",
        priority: n.priority === "LOW" ? "NORMAL" : n.priority,
        category: n.category === "SAFETY" ? "SAFETY" : "GENERAL",
        title: n.title,
        titleBn: n.titleBn ?? n.title,
        body: n.refNo,
        bodyBn: n.refNo,
        data: { module: "notices", objectType: "Notice", objectId: n.id, route: `/notices/${n.id}` },
        readAt: r.readAt,
        ackRequired: criticalAck(n) && !r.ackedAt,
        createdAt: n.publishAt,
      });
    }
  }
  db.notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
