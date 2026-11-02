import type { Urgency } from "@/types/domain/common";
import type { RoleKey } from "@/types/domain/identity";
import type { ApprovalCategory, InstanceStatus, StepDecision, WorkflowObjectType } from "@/types/domain/workflow";
import { hoursFromNow } from "../clock";
import type { MockWfAction, MockWfInstance, MockWfStep } from "../db/schema";
import { empId } from "./org";

interface SeedStep {
  key: string;
  name: string;
  nameBn: string;
  role?: RoleKey;
  emp?: string;
  sla: number;
  sig?: boolean;
  done?: { by: string; hoursAgo: number; comment: string; decision?: StepDecision; reasonCategory?: string; improvements?: string };
}

export interface SeedSpec {
  ref: string;
  type: WorkflowObjectType;
  objectId: string;
  initiator: string;
  category: ApprovalCategory;
  urgency: Urgency;
  amount?: number;
  qty?: [string, string];
  title: string;
  titleBn: string;
  details: string;
  detailsBn: string;
  submittedHoursAgo: number;
  submitNote?: string;
  /** Hours left on the active step's SLA (negative = breached). */
  slaLeft?: number;
  steps: SeedStep[];
}

export const STEP = {
  HOD: { key: "HOD", name: "Department head", nameBn: "বিভাগীয় প্রধান" },
  LM: { key: "LINE_MANAGER", name: "Line manager", nameBn: "লাইন ম্যানেজার" },
  HR: { key: "HR", name: "HR verification", nameBn: "এইচআর যাচাই" },
  PGM: { key: "PLANT_GM", name: "Plant GM review", nameBn: "প্ল্যান্ট জিএম পর্যালোচনা" },
  FIN: { key: "FIN", name: "Finance verification", nameBn: "অর্থ বিভাগ যাচাই" },
  CMD: { key: "CMD", name: "Chairman's sanction", nameBn: "চেয়ারম্যানের অনুমোদন" },
} as const;

const slug = (ref: string) => ref.toLowerCase().replace(/[^a-z0-9]+/g, "_");

export function buildSeedInstance(spec: SeedSpec): MockWfInstance {
  const id = `wfi_${slug(spec.ref)}`;
  const submittedAt = hoursFromNow(-spec.submittedHoursAgo);
  const initiator = empId(spec.initiator);
  const actions: MockWfAction[] = [
    { id: `${id}_a0`, type: "SUBMIT", stepNo: null, actorEmployeeId: initiator, comment: spec.submitNote ?? null, details: null, at: submittedAt },
  ];
  let status: InstanceStatus = "IN_REVIEW";
  let completedAt: string | null = null;
  let lastAt = submittedAt;
  let activated = false;

  const steps: MockWfStep[] = spec.steps.map((s, i) => {
    const stepNo = i + 1;
    const base: MockWfStep = {
      id: `${id}_s${stepNo}`, stepNo, key: s.key, name: s.name, nameBn: s.nameBn,
      approverRole: s.emp ? null : (s.role ?? null), approverEmployeeId: s.emp ? empId(s.emp) : null,
      slaHours: s.sla, requiresSignature: s.sig ?? false, status: "WAITING", decision: null, comment: null,
      activatedAt: null, dueAt: null, decidedAt: null, decidedByEmployeeId: null, signatureHash: null,
    };
    if (status !== "IN_REVIEW") return { ...base, status: "SKIPPED" };
    if (s.done) {
      const at = hoursFromNow(-s.done.hoursAgo);
      const decision = s.done.decision ?? "APPROVED";
      const by = empId(s.done.by);
      actions.push({
        id: `${id}_a${stepNo}`,
        type: decision === "APPROVED" ? "APPROVE" : decision === "REJECTED" ? "REJECT" : "RETURN",
        stepNo, actorEmployeeId: by, comment: s.done.comment,
        details: s.done.reasonCategory ? { reasonCategory: s.done.reasonCategory, improvementsRequired: s.done.improvements } : null,
        at,
      });
      const activatedAt = lastAt;
      lastAt = at;
      if (decision !== "APPROVED") {
        status = decision;
        completedAt = at;
      }
      return {
        ...base, status: "COMPLETED", decision, comment: s.done.comment, activatedAt,
        dueAt: new Date(new Date(activatedAt).getTime() + s.sla * 3_600_000).toISOString(),
        decidedAt: at, decidedByEmployeeId: by,
        signatureHash: s.sig ? `seed-${slug(spec.ref)}-${stepNo}` : null,
      };
    }
    if (!activated) {
      activated = true;
      return { ...base, status: "ACTIVE", activatedAt: lastAt, dueAt: hoursFromNow(spec.slaLeft ?? s.sla) };
    }
    return base;
  });

  if (status === "IN_REVIEW" && !activated) {
    status = "APPROVED";
    completedAt = lastAt;
  }

  return {
    id, objectType: spec.type, objectId: spec.objectId, status, initiatorEmployeeId: initiator,
    summary: {
      refNo: spec.ref, title: spec.title, titleBn: spec.titleBn, details: spec.details, detailsBn: spec.detailsBn,
      amount: spec.amount !== undefined ? spec.amount.toFixed(2) : null,
      quantityLabel: spec.qty?.[0] ?? null, quantityLabelBn: spec.qty?.[1] ?? null,
      urgency: spec.urgency, category: spec.category,
    },
    submittedAt, completedAt, steps, actions,
  };
}

/** Mirrors the web prototype's Approvals Center seed, routed to the persona who would really decide each step. */
const SPECS: SeedSpec[] = [
  {
    ref: "BOGCL/PLANT/2026/0894", type: "NoteSheet", objectId: "ns_0894", initiator: "EMP-1088",
    category: "PROCUREMENT", urgency: "CRITICAL", amount: 4_850_000, submittedHoursAgo: 52, slaLeft: 6,
    title: "Backup Power Generator Maintenance & Spare Parts Purchase",
    titleBn: "ব্যাকআপ বিদ্যুৎ জেনারেটর মেরামত ও যন্ত্রাংশ ক্রয়",
    details: "Urgent servicing and genuine parts for the 1,200 kVA main backup generator at Keraniganj Plant (Energypac lowest quote with 1-year warranty).",
    detailsBn: "কেরানীগঞ্জ প্ল্যান্টের ১,২০০ কেভিএ ব্যাকআপ জেনারেটরের জরুরি সার্ভিসিং ও আসল যন্ত্রাংশ (এনার্জিপ্যাক সর্বনিম্ন দর, ১ বছরের ওয়ারেন্টি)।",
    submitNote: "Inspection found worn water pump and seals on the 1,200 kVA backup generator. Servicing needed before peak winter production.",
    steps: [
      { ...STEP.PGM, emp: "EMP-0012", sla: 24, done: { by: "EMP-0012", hoursAgo: 44, comment: "3 vendor quotes compared. Energypac Power selected at ৳48,50,000 with genuine parts and 12-month warranty." } },
      { ...STEP.FIN, role: "FINANCE", sla: 24, done: { by: "EMP-0062", hoursAgo: 20, comment: "Funds verified available in Factory Maintenance Account (ACC-4102-KER). Recommended for final approval." } },
      { ...STEP.CMD, role: "CHAIRMAN", sla: 18, sig: true },
    ],
  },
  {
    ref: "ARQ-2026-022", type: "AssetRequisition", objectId: "arq_022", initiator: "EMP-0012",
    category: "ASSETS", urgency: "HIGH", amount: 4_200_000, submittedHoursAgo: 70, slaLeft: 14,
    title: "Asset Purchase Request — New 3-Ton Electric Warehouse Forklift",
    titleBn: "নতুন ৩-টন ইলেকট্রিক ফর্কলিফট ক্রয়ের আবেদন",
    details: "Replaces retired 2016 diesel forklift with a clean electric loader for Keraniganj drum warehouse. Already endorsed by Head of Finance.",
    detailsBn: "কেরানীগঞ্জ ড্রাম গুদামের জন্য ২০১৬ সালের ডিজেল ফর্কলিফটের পরিবর্তে পরিচ্ছন্ন বৈদ্যুতিক লোডার। অর্থ বিভাগ সমর্থন করেছে।",
    submitNote: "Old 2016 forklift retired after 10 years of service. New electric unit lowers fuel & repair costs.",
    steps: [
      { ...STEP.FIN, role: "FINANCE", sla: 24, done: { by: "EMP-0062", hoursAgo: 46, comment: "Budget checked and endorsed for Executive sanction." } },
      { ...STEP.CMD, role: "CHAIRMAN", sla: 24, sig: true },
    ],
  },
  {
    ref: "SPRT-2026-003", type: "Claim", objectId: "clm_sprt_003", initiator: "EMP-0045",
    category: "CLAIMS", urgency: "NORMAL", amount: 362_400, submittedHoursAgo: 30, slaLeft: 16,
    title: "Event Expense Settlement — Annual Staff Sports & Family Day",
    titleBn: "বার্ষিক কর্মী ক্রীড়া ও মিলনমেলা ব্যয় নিষ্পত্তি",
    details: "৳3,50,000 advance taken earlier; ৳12,400 remaining balance payable for 350 staff catering, tents, and team jerseys.",
    detailsBn: "আগে ৳৩,৫০,০০০ অগ্রিম নেওয়া হয়েছে; ৩৫০ কর্মীর খাবার, তাঁবু ও জার্সির জন্য ৳১২,৪০০ বাকি।",
    steps: [
      { ...STEP.LM, emp: "EMP-0028", sla: 24 },
      { ...STEP.FIN, role: "FINANCE", sla: 24 },
    ],
  },
  {
    ref: "ARQ-2026-023", type: "AssetRequisition", objectId: "arq_023", initiator: "EMP-1042",
    category: "ASSETS", urgency: "NORMAL", amount: 95_000, submittedHoursAgo: 26, slaLeft: 24,
    title: "Asset Request — Portable Projector for Client Presentations",
    titleBn: "ক্লায়েন্ট প্রেজেন্টেশনের জন্য পোর্টেবল প্রজেক্টর ক্রয়",
    details: "Epson Full HD projector for dealer meetings and Roads & Highways tender presentations.",
    detailsBn: "ডিলার সভা ও সড়ক ও জনপথ দরপত্র উপস্থাপনার জন্য এপসন ফুল এইচডি প্রজেক্টর।",
    steps: [
      { ...STEP.HOD, emp: "EMP-0062", sla: 24 },
      { ...STEP.FIN, role: "FINANCE", sla: 24 },
    ],
  },
  {
    ref: "BOGCL/ADMIN/2026/0518", type: "NoteSheet", objectId: "ns_0518", initiator: "EMP-0045",
    category: "PROCUREMENT", urgency: "NORMAL", amount: 85_000, submittedHoursAgo: 3, slaLeft: 12,
    title: "Quarterly Head Office Printing Paper, Stationery & Toner Purchase",
    titleBn: "প্রধান কার্যালয়ের ত্রৈমাসিক কাগজ, স্টেশনারি ও টোনার ক্রয়",
    details: "150 reams of A4 paper, envelopes, and 18 printer toners for 5 Head Office floors (Prime Office Supplies lowest quote).",
    detailsBn: "প্রধান কার্যালয়ের ৫টি ফ্লোরের জন্য ১৫০ রিম এ৪ কাগজ, খাম ও ১৮টি টোনার (প্রাইম অফিস সাপ্লাইজ সর্বনিম্ন দর)।",
    submitNote: "3 market quotes collected; Prime Office Supplies selected as lowest price.",
    steps: [
      { ...STEP.HR, emp: "EMP-0028", sla: 12, done: { by: "EMP-0028", hoursAgo: 2, comment: "Stock quantities verified and forwarded to Finance." } },
      { ...STEP.FIN, role: "FINANCE", sla: 24 },
    ],
  },
  {
    ref: "TADA-2026-0419", type: "Claim", objectId: "clm_tada_0419", initiator: "EMP-1042",
    category: "CLAIMS", urgency: "NORMAL", amount: 14_850, submittedHoursAgo: 40, slaLeft: 18,
    title: "Travel Expense Claim — Chattogram Dealer Visits (4 Days)",
    titleBn: "ভ্রমণ ব্যয় বিল — চট্টগ্রাম ডিলার পরিদর্শন (৪ দিন)",
    details: "4-day dealer visit & payment collection trip with official hotel VAT receipt and bus tickets attached.",
    detailsBn: "৪ দিনের ডিলার পরিদর্শন ও বকেয়া আদায়; হোটেলের ভ্যাট রসিদ ও বাসের টিকিট সংযুক্ত।",
    steps: [
      { ...STEP.HOD, emp: "EMP-0062", sla: 24 },
      { ...STEP.FIN, role: "FINANCE", sla: 24 },
    ],
  },
  {
    ref: "CNV-2026-1002", type: "Claim", objectId: "clm_cnv_1002", initiator: "EMP-1042",
    category: "CLAIMS", urgency: "NORMAL", amount: 5_420, submittedHoursAgo: 20, slaLeft: 26,
    title: "Local Travel Expense Bill — Dhaka & Narayanganj Client Visits",
    titleBn: "স্থানীয় যাতায়াত বিল — ঢাকা ও নারায়ণগঞ্জ ক্লায়েন্ট ভিজিট",
    details: "Local CNG and car fares for client and distributor visits between 16 Oct and 28 Oct 2026.",
    detailsBn: "১৬–২৮ অক্টোবর ২০২৬ ক্লায়েন্ট ও পরিবেশক পরিদর্শনের সিএনজি ও গাড়ি ভাড়া।",
    steps: [
      { ...STEP.HOD, emp: "EMP-0062", sla: 48 },
      { ...STEP.FIN, role: "FINANCE", sla: 24 },
    ],
  },
  {
    ref: "REQ-2026-0441", type: "Requisition", objectId: "req_0441", initiator: "EMP-1042",
    category: "FLEET", urgency: "HIGH", qty: ["2 passengers · round trip", "২ যাত্রী · আসা-যাওয়া"], submittedHoursAgo: 1, slaLeft: 4,
    title: "Company Car Booking — Head Office to Keraniganj Plant",
    titleBn: "অফিসিয়াল গাড়ির আবেদন — প্রধান কার্যালয় হতে কেরানীগঞ্জ প্ল্যান্ট",
    details: "Round trip today 2:30 PM – 6:00 PM (2 passengers) to deliver signed highway supply papers to Plant GM.",
    detailsBn: "আজ দুপুর ২:৩০ – সন্ধ্যা ৬:০০ (২ জন) প্ল্যান্ট জিএম-এর কাছে স্বাক্ষরিত সরবরাহ নথি পৌঁছাতে।",
    steps: [{ key: "ENDORSE", name: "Department endorsement", nameBn: "বিভাগীয় অনুমোদন", emp: "EMP-0062", sla: 6 }],
  },
  {
    ref: "REQ-2026-0443", type: "Requisition", objectId: "req_0443", initiator: "EMP-0914",
    category: "FLEET", urgency: "NORMAL", qty: ["1 passenger · one way", "১ যাত্রী · এক দিক"], submittedHoursAgo: 1, slaLeft: 5,
    title: "Company Car Booking — Head Office to Keraniganj Gate #1",
    titleBn: "অফিসিয়াল গাড়ির আবেদন — প্রধান কার্যালয় হতে প্ল্যান্ট গেট #১",
    details: "One-way trip today at 2:45 PM to carry visitor pass printer & security logbooks to Keraniganj Gate #1.",
    detailsBn: "আজ দুপুর ২:৪৫-এ ভিজিটর পাস প্রিন্টার ও নিরাপত্তা লগবুক গেট #১-এ নিয়ে যাওয়া।",
    steps: [{ key: "ENDORSE", name: "Site endorsement", nameBn: "সাইট অনুমোদন", emp: "EMP-0012", sla: 6 }],
  },
  {
    ref: "LV-2026-089", type: "LeaveRequest", objectId: "lv_089", initiator: "EMP-0733",
    category: "LEAVE", urgency: "NORMAL", qty: ["5 days · sick leave", "৫ দিন · অসুস্থতাজনিত ছুটি"], submittedHoursAgo: 4, slaLeft: 36,
    title: "Sick Leave Application — Post-Surgery Medical Rest (5 Days)",
    titleBn: "অসুস্থতাজনিত ছুটির আবেদন — চিকিৎসা বিশ্রাম (৫ দিন)",
    details: "Evercare Hospital doctor certificate attached. Daily work handed over to colleague.",
    detailsBn: "এভারকেয়ার হাসপাতালের চিকিৎসা সনদ সংযুক্ত। দৈনন্দিন কাজ সহকর্মীকে হস্তান্তর করা হয়েছে।",
    submitNote: "Submitted medical certificate and duty handover note.",
    steps: [
      { ...STEP.HR, emp: "EMP-0028", sla: 12, done: { by: "EMP-0028", hoursAgo: 3, comment: "14 days sick leave balance available. Forwarded for department approval." } },
      { ...STEP.HOD, emp: "EMP-0062", sla: 48 },
    ],
  },
  {
    ref: "TADA-2026-0402", type: "Claim", objectId: "clm_tada_0402", initiator: "EMP-1104",
    category: "CLAIMS", urgency: "HIGH", amount: 9_800, submittedHoursAgo: 120, slaLeft: -3,
    title: "Travel Expense Claim — DoE Environmental Clearance Hearing",
    titleBn: "ভ্রমণ ব্যয় বিল — পরিবেশ অধিদপ্তরের ছাড়পত্র শুনানি",
    details: "2-day hearing at Agargaon: daily allowance, notarisation & filing fees, local transport (receipts attached).",
    detailsBn: "আগারগাঁওয়ে ২ দিনের শুনানি: দৈনিক ভাতা, নোটারি ও ফাইলিং ফি, স্থানীয় যাতায়াত (রসিদ সংযুক্ত)।",
    steps: [
      { ...STEP.HOD, emp: "EMP-0012", sla: 24, done: { by: "EMP-0012", hoursAgo: 96, comment: "Hearing attendance confirmed. Endorsed." } },
      { ...STEP.FIN, role: "FINANCE", sla: 24 },
    ],
  },
  {
    ref: "BOGCL/IT/2026/0211", type: "NoteSheet", objectId: "ns_0211", initiator: "EMP-0782",
    category: "PROCUREMENT", urgency: "HIGH", amount: 1_850_000, submittedHoursAgo: 260,
    title: "Annual Office Software, Email & Cloud Backup Renewal (2026–2027)",
    titleBn: "বার্ষিক অফিস সফটওয়্যার, ইমেইল ও ক্লাউড ব্যাকআপ নবায়ন",
    details: "12-month renewal for company accounting software, staff business email, and daily cloud backup.",
    detailsBn: "হিসাব সফটওয়্যার, কর্মীদের ব্যবসায়িক ইমেইল ও দৈনিক ক্লাউড ব্যাকআপের ১২ মাসের নবায়ন।",
    steps: [
      { ...STEP.HOD, emp: "EMP-0062", sla: 24, done: { by: "EMP-0062", hoursAgo: 240, comment: "Renewal within IT budget line. Forwarded." } },
      { ...STEP.CMD, role: "CHAIRMAN", sla: 18, sig: true, done: { by: "EMP-0001", hoursAgo: 228, comment: "Approved. Negotiate a 3-year rate next cycle." } },
    ],
  },
  {
    ref: "TOUR-2026-008", type: "Claim", objectId: "clm_tour_008", initiator: "EMP-0012",
    category: "CLAIMS", urgency: "NORMAL", amount: 40_500, submittedHoursAgo: 150,
    title: "Tour Settlement — Chattogram Depot Check & Customer Meetings",
    titleBn: "ভ্রমণ নিষ্পত্তি — চট্টগ্রাম ডিপো পরিদর্শন ও গ্রাহক সভা",
    details: "4-day official regional visit. ৳45,000 advance taken; ৳4,500 refundable to company.",
    detailsBn: "৪ দিনের দাপ্তরিক আঞ্চলিক সফর। ৳৪৫,০০০ অগ্রিম; ৳৪,৫০০ কোম্পানিকে ফেরতযোগ্য।",
    steps: [
      { ...STEP.LM, emp: "EMP-0001", sla: 24, done: { by: "EMP-0001", hoursAgo: 140, comment: "Visit outcomes noted. Approved." } },
      { ...STEP.FIN, role: "FINANCE", sla: 24, done: { by: "EMP-0062", hoursAgo: 120, comment: "Advance adjusted; refund voucher VCH-2026-10492 raised." } },
    ],
  },
  {
    ref: "CNV-2026-0961", type: "Claim", objectId: "clm_cnv_0961", initiator: "EMP-1042",
    category: "CLAIMS", urgency: "NORMAL", amount: 3_850, submittedHoursAgo: 110,
    title: "Local Travel Expense Bill — Gulshan & Tejgaon Dealer Follow-ups",
    titleBn: "স্থানীয় যাতায়াত বিল — গুলশান ও তেজগাঁও ডিলার ফলো-আপ",
    details: "Ride-share and CNG fares for dealer follow-ups, 10–15 Oct 2026.",
    detailsBn: "১০–১৫ অক্টোবর ২০২৬ ডিলার ফলো-আপের রাইড-শেয়ার ও সিএনজি ভাড়া।",
    steps: [
      {
        ...STEP.HOD, emp: "EMP-0062", sla: 24,
        done: {
          by: "EMP-0062", hoursAgo: 72, decision: "RETURNED", comment: "Two ride-share trips have no receipts attached.",
          reasonCategory: "Missing receipts", improvements: "Attach ride-share receipts for the 12 and 14 Oct trips and resubmit.",
        },
      },
      { ...STEP.FIN, role: "FINANCE", sla: 24 },
    ],
  },
];

export function buildWorkflowSeed(): MockWfInstance[] {
  return SPECS.map(buildSeedInstance);
}
