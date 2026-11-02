/** MOD-10 attendance wire shapes (doc 03 §16.1, doc 02 enums). Coordinates and distances are JSON numbers. */
import type { PersonRef } from "./common";
import type { SiteRef } from "./identity";

export type PunchType = "IN" | "OUT";
export type PunchResult = "ACCEPTED" | "REJECTED_OUTSIDE_FENCE" | "REJECTED_ACCURACY" | "REJECTED_MOCK" | "PENDING_REGULARISATION";
export type DayStatus = "PRESENT" | "LATE" | "EARLY_LEAVE" | "ABSENT" | "ON_LEAVE" | "HOLIDAY" | "WEEKEND" | "FIELD_DUTY" | "HALF_DAY";
export type RegularisationType = "MISSED_PUNCH" | "FIELD_DUTY" | "LATE_JUSTIFICATION" | "REMOTE_WORK";
/** Doc 02 `LeaveStatus`, shared by leave requests and regularisations. */
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface Geofence {
  id: string;
  site: SiteRef;
  name: string;
  nameBn: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
}

export interface Shift {
  id: string;
  code: string;
  name: string;
  nameBn: string;
  /** Local `HH:mm`. */
  startTime: string;
  endTime: string;
  graceMinutes: number;
}

export interface Punch {
  id: string;
  type: PunchType;
  punchedAt: string;
  result: PunchResult;
  site: SiteRef | null;
  distanceM: number | null;
  accuracyM: number | null;
}

export interface DayLeaveRef {
  id: string;
  refNo: string;
  typeCode: string;
  status: RequestStatus;
}

export interface AttendanceDay {
  /** `YYYY-MM-DD`, local. */
  date: string;
  /** `null` while today has no punch yet (or for future days). */
  status: DayStatus | null;
  firstInAt: string | null;
  lastOutAt: string | null;
  lateMinutes: number;
  workedMinutes: number;
  overtimeMinutes: number;
  site: SiteRef | null;
  holiday: { name: string; nameBn: string } | null;
  flags: { missingOut: boolean; earlyLeave: boolean; pendingReview: boolean };
  leave: DayLeaveRef | null;
  punches: Punch[];
}

export interface NearestGeofence {
  id: string;
  site: SiteRef;
  name: string;
  nameBn: string;
  distanceM: number;
  inside: boolean;
}

export interface TodayAttendance {
  date: string;
  shift: Shift;
  day: AttendanceDay;
  nextPunchType: PunchType;
  /** Present when `?lat&lng` were sent. */
  nearestGeofence: NearestGeofence | null;
  overtimeMinutesMtd: number;
}

export interface PunchRequest {
  type: PunchType;
  punchedAt: string;
  lat: number;
  lng: number;
  accuracyM: number | null;
  isMockLocation: boolean;
  platform: "ANDROID" | "IOS";
  deviceId: string;
  siteId?: string;
  /** "Punch anyway (field duty)" from outside every fence (doc 05 §8.2). */
  fieldDutyRequested?: boolean;
  note?: string;
}

export interface PunchResponse {
  id: string;
  result: PunchResult;
  geofence: { id: string; name: string; nameBn: string; distanceM: number } | null;
  day: AttendanceDay;
  canRegularise: boolean;
  /** Field-duty review opened for a `PENDING_REGULARISATION` punch. */
  regularisationId: string | null;
  /** Same type within 5 minutes: the earlier punch is returned unchanged (BR-10-03). */
  duplicate: boolean;
}

export interface AttendanceSummary {
  present: number;
  late: number;
  absent: number;
  leave: number;
  fieldDuty: number;
  workedMinutes: number;
  overtimeMinutes: number;
}

export interface AttendanceRange {
  from: string;
  to: string;
  days: AttendanceDay[];
  summary: AttendanceSummary;
}

export interface RosterRow {
  employee: PersonRef;
  site: SiteRef;
  shift: Shift;
  day: AttendanceDay;
  insideFence: boolean;
  distanceM: number | null;
  overtimeMinutesMtd: number;
  isSelf: boolean;
}

export type RosterFilter = "ALL" | "IN" | "LATE" | "NOT_IN" | "ON_LEAVE" | "REVIEW";

export interface AttendanceKpis {
  headcount: number;
  present: number;
  late: number;
  absent: number;
  notIn: number;
  onLeave: number;
  fieldDuty: number;
  /** Regularisations and leave requests waiting on the caller. */
  pendingRegularisations: number;
  pendingLeave: number;
  overtimeMinutesMtd: number;
}

export interface Regularisation {
  id: string;
  refNo: string;
  employee: PersonRef;
  date: string;
  type: RegularisationType;
  requestedIn: string | null;
  requestedOut: string | null;
  reason: string;
  status: RequestStatus;
  createdAt: string;
  workflowInstanceId: string | null;
}

export interface CreateRegularisationRequest {
  date: string;
  type: RegularisationType;
  requestedIn?: string;
  requestedOut?: string;
  reason: string;
}
