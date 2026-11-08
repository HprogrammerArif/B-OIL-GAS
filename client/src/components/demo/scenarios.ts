/**
 * Presenter scenarios — one click puts the right persona on the right screen,
 * aligned with the demo script acts (docs/05). Scenarios that need fresh data
 * create it through the same store APIs the product screens use, so the record
 * appears everywhere (badges, notifications, approvals) exactly as if a user
 * had submitted it.
 */
import type { AppRole, AppView } from '../../types';
import { ROLE_META, SYSTEM_TODAY } from '../../types';
import { sessionStore } from '../../auth/session';
import { navigate } from '../../lib/router';
import { nextRef } from '../../lib/refs';
import { nowTime } from '../../lib/clock';
import { fleetStore } from '../../store/fleetStore';
import { approvalStore } from '../../store/approvalStore';
import { incidentPhotoFor, operationsStore } from '../../store/operationsStore';

export interface DemoScenario {
  id: string;
  label: [string, string];
  hint: [string, string];
  persona: AppRole;
  view: AppView;
  prepare?: () => void;
}

function injectTripRequest() {
  const requester = ROLE_META.employee;
  const created = fleetStore.addRequisition({
    requesterName: requester.name,
    requesterEmpId: requester.empId,
    requesterRole: requester.label,
    dept: requester.dept,
    phone: requester.phone,
    from: 'Head Office, Baridhara',
    to: 'Keraniganj Bitumen Refinery',
    tripType: 'round_trip',
    departureTime: 'Today, 04:00 PM',
    returnTime: 'Today, 07:30 PM',
    requiredCapacity: 'sedan_4',
    passengersCount: 2,
    passengerNames: `${requester.name}, Rashedul Hasan`,
    purpose: 'Dealer quality complaint — joint sample inspection at the refinery lab',
    costCenter: 'SLS-DHK-04',
    estimatedCost: 1500,
  });
  approvalStore.addRequisitionApproval(created.id, created.requesterName, created.dept, created.from, created.to, created.purpose);
}

function injectIncident() {
  const template = operationsStore.getIncidents()[0];
  if (!template) return;
  const reporter = ROLE_META.employee;
  const ref = nextRef('INC');
  const photo = incidentPhotoFor('near_miss');
  operationsStore.addIncident({
    ...template,
    id: ref,
    incNo: ref,
    title: 'Bitumen drip at tanker loading arm, Bay 2',
    titleBn: 'ট্যাংকার লোডিং আর্ম থেকে বিটুমিন চুইয়ে পড়ছে, বে-২',
    incidentType: 'near_miss',
    category: 'spill',
    level: 2,
    likelihood: 3,
    riskScore: 6,
    riskCategory: 'medium',
    location: 'Tanker loading bay 2',
    reportedBy: `${reporter.name} (${reporter.label})`,
    reporterEmpId: reporter.empId,
    date: `${SYSTEM_TODAY}, ${nowTime()}`,
    workflowStage: 'reported',
    immediateActionsTaken: 'Loading paused, drip tray placed, area barricaded.',
    personsInvolved: [],
    rootCause: 'Not yet investigated.',
    fiveWhys: undefined,
    fishboneFactors: undefined,
    capaItems: [],
    capaAction: 'Inspect loading-arm seal and replace if worn.',
    capaStatus: 'open',
    statutoryReportable: false,
    statutoryAgency: undefined,
    statutoryNoticeHours: undefined,
    evidenceAttached: false,
    spotFiles: undefined,
    photo,
    photos: [photo],
    closureSignOff: undefined,
  });
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'act1',
    label: ['Chairman briefing', 'চেয়ারম্যানের ব্রিফিং'],
    hint: ['Act 1 · executive overview', 'অংক ১ · এক্সিকিউটিভ ওভারভিউ'],
    persona: 'chairman',
    view: 'dashboard',
  },
  {
    id: 'act2',
    label: ['File awaiting signature', 'স্বাক্ষরের অপেক্ষায় নথি'],
    hint: ['Act 2 · note-sheet sign-off', 'অংক ২ · নোট-শিট স্বাক্ষর'],
    persona: 'chairman',
    view: 'notesheet',
  },
  {
    id: 'act3',
    label: ['Permit renewals', 'লাইসেন্স নবায়ন'],
    hint: ['Act 3 · compliance pipeline', 'অংক ৩ · কমপ্লায়েন্স'],
    persona: 'plant_gm',
    view: 'compliance',
  },
  {
    id: 'act4',
    label: ['Parcel handover', 'পার্সেল হস্তান্তর'],
    hint: ['Act 4 · chain of custody', 'অংক ৪ · হেফাজত শৃঙ্খল'],
    persona: 'transport_admin',
    view: 'parcel',
  },
  {
    id: 'act5',
    label: ['New trip request', 'নতুন গাড়ির আবেদন'],
    hint: ['Act 5 · creates a request from Tanvir for dispatch', 'অংক ৫ · তানভীরের নতুন আবেদন'],
    persona: 'transport_admin',
    view: 'fleet',
    prepare: injectTripRequest,
  },
  {
    id: 'act6',
    label: ['Shuttle seat & waitlist', 'বাস সিট ও অপেক্ষমাণ তালিকা'],
    hint: ['Act 6 · employee view', 'অংক ৬ · কর্মীর দৃশ্য'],
    persona: 'employee',
    view: 'bus',
  },
  {
    id: 'incident',
    label: ['Incident just reported', 'সদ্য রিপোর্ট করা দুর্ঘটনা'],
    hint: ['Creates a near-miss report for the Plant GM', 'প্ল্যান্ট জিএম-এর জন্য নতুন রিপোর্ট'],
    persona: 'plant_gm',
    view: 'incident',
    prepare: injectIncident,
  },
];

export function runScenario(s: DemoScenario) {
  s.prepare?.();
  sessionStore.switchPersona(s.persona);
  navigate(s.view);
}
