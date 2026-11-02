import type { IconName } from "@/components/ui/Icon";
import type { Priority } from "@/types/domain/common";
import type { NoticeAudienceRef, NoticeCategory } from "@/types/domain/notice";

export interface NoticeTemplate {
  key: "directive" | "safety" | "maintenance" | "holiday";
  icon: IconName;
  category: NoticeCategory;
  priority: Priority;
  audience: NoticeAudienceRef;
  isPinned: boolean;
  requiresAck: boolean;
  /** Prefilled bilingual content; the author edits it before publishing. */
  title: string;
  titleBn: string;
  body: string;
  bodyBn: string;
}

/** Quick-start templates from the web prototype's publish form (`PublishNoticeModal`). */
export const NOTICE_TEMPLATES: NoticeTemplate[] = [
  {
    key: "directive",
    icon: "ribbon-outline",
    category: "EXECUTIVE",
    priority: "HIGH",
    audience: { type: "ALL", refId: null },
    isPinned: true,
    requiresAck: true,
    title: "Chairman's Special Directive — Operational Safety & Discipline Compliance",
    titleBn: "চেয়ারম্যানের বিশেষ নির্দেশনা — নিরাপত্তা ও শৃঙ্খলা বিধান",
    body: "In alignment with Bashundhara Group's zero-incident commitment, all departmental heads, plant managers, and depot supervisors are strictly directed to conduct mandatory safety roll-calls at the start of every shift. Full operational integrity must be maintained across all bitumen refining and logistics assets without compromise.",
    bodyBn: "বসুন্ধরা গ্রুপের জিরো-ইনসিডেন্ট নীতির আলোকে সকল বিভাগীয় প্রধান ও প্ল্যান্ট ম্যানেজারদের প্রতি শিফটে বাধ্যতামূলক নিরাপত্তা ব্রিফিং নিশ্চিত করার কঠোর নির্দেশ দেওয়া হলো।",
  },
  {
    key: "safety",
    icon: "warning-outline",
    category: "SAFETY",
    priority: "CRITICAL",
    audience: { type: "SITE", refId: "site_plant" },
    isPinned: true,
    requiresAck: true,
    title: "Urgent Safety Circular — High-Pressure Steam & Bitumen Line Lockout Compliance",
    titleBn: "জরুরি নিরাপত্তা সার্কুলার — হাই-প্রেসার স্টিম ও বিটুমিন লাইন এলওটিও মানদণ্ড",
    body: "Effective immediately, dual-lock Lockout/Tagout (LOTO) protocols are strictly mandatory on all Unit-2 bitumen booster pumps and distillation columns prior to any mechanical inspection. Any bypass of safety interlocks will result in instant disciplinary escalation.",
    bodyBn: "অবিলম্বে কার্যকর: সকল বিটুমিন বুস্টার পাম্প ও ডিস্টিলেশন কলামে ডুয়াল-লক এলওটিও প্রোটোকল কঠোরভাবে বাধ্যতামূলক। নিরাপত্তা নিয়ম লঙ্ঘনে তাৎক্ষণিক শাস্তিমূলক ব্যবস্থা গ্রহণ করা হবে।",
  },
  {
    key: "maintenance",
    icon: "construct-outline",
    category: "OPERATIONS",
    priority: "NORMAL",
    audience: { type: "SITE", refId: "site_plant" },
    isPinned: false,
    requiresAck: false,
    title: "Planned DCS Automation Upgrade & Scheduled Throughput Optimization",
    titleBn: "পরিকল্পিত ডিসিএস অটোমেশন আপগ্রেড ও শিডিউল মেইনটেন্যান্স",
    body: "Scheduled software calibration for DCS Node C-102 will be conducted on Sunday from 02:00 AM to 05:00 AM. Redundant analog safety controllers will remain active throughout the maintenance window.",
    bodyBn: "আগামী রবিবার রাত ২টা থেকে ভোর ৫টা পর্যন্ত ডিসিএস নোড সি-১০২ এর নির্ধারিত সফটওয়্যার ক্যালিব্রেশন অনুষ্ঠিত হবে। এ সময় সহায়ক নিরাপত্তা ব্যবস্থা সক্রিয় থাকবে।",
  },
  {
    key: "holiday",
    icon: "calendar-outline",
    category: "HR",
    priority: "NORMAL",
    audience: { type: "ALL", refId: null },
    isPinned: false,
    requiresAck: false,
    title: "Corporate Circular — Official Holiday Observation & Essential Operations Roster",
    titleBn: "কর্পোরেট সার্কুলার — সরকারি ছুটির দিন ও জরুরি ডিউটি রোস্টার",
    body: "Head Office and administrative branches will observe holiday closure. Continuous operational units (Refinery DCS, Security, Gate Logistics, and Tank Farm) will operate under standard holiday overtime roster with full safety clearance.",
    bodyBn: "হেড অফিস ও প্রশাসনিক শাখাসমূহ ছুটিতে বন্ধ থাকবে। রিফাইনারি ডিসিএস, নিরাপত্তা ও গেট লজিস্টিকসের মতো জরুরি ইউনিটসমূহ ছুটির ডিউটি রোস্টারে চালু থাকবে।",
  },
];

/** Default text of the prototype's chairman broadcast (`BroadcastModal`). */
export const BROADCAST_DEFAULT = {
  title: "180 Days Accident-Free Milestone at Keraniganj Plant",
  body: "Alhamdulillah, Bashundhara Oil & Gas has completed 180 straight days with zero workplace injuries at Keraniganj Plant. Thank you to every engineer, operator, driver, and office team member for keeping safety first every day.",
};
