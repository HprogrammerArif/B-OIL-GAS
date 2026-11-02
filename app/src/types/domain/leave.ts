/** MOD-10 leave wire shapes (doc 03 §16.2). `days` is a JSON number (0.5 steps). */
import type { RequestStatus } from "./attendance";
import type { PersonRef } from "./common";
import type { WorkflowInstance } from "./workflow";

export type LeaveCode = "CL" | "SL" | "EL" | "ML" | "PL" | "LWP";
export type HalfDay = "FIRST" | "SECOND";

export interface LeaveType {
  id: string;
  code: LeaveCode;
  name: string;
  nameBn: string;
  annualQuota: number;
  requiresDoc: boolean;
  halfDayAllowed: boolean;
  /** False for unpaid leave (LWP has no balance check). */
  checksBalance: boolean;
}

export interface LeaveBalance {
  leaveType: LeaveType;
  year: number;
  entitled: number;
  used: number;
  pending: number;
  available: number;
}

export interface LeaveTypeRef {
  id: string;
  code: LeaveCode;
  name: string;
  nameBn: string;
}

export interface LeaveRequestItem {
  id: string;
  refNo: string;
  employee: PersonRef;
  leaveType: LeaveTypeRef;
  startDate: string;
  endDate: string;
  halfDay: HalfDay | null;
  days: number;
  reason: string;
  status: RequestStatus;
  isInformed: boolean;
  createdAt: string;
  reviewedBy: PersonRef | null;
  reviewedAt: string | null;
  workflowInstanceId: string | null;
}

export interface LeaveRequestDetail extends LeaveRequestItem {
  cancelReason: string | null;
  workflow: WorkflowInstance | null;
  viewer: { isOwner: boolean; canCancel: boolean };
}

export interface CreateLeaveRequest {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  halfDay: HalfDay | null;
  reason: string;
}

export interface LeavePolicy {
  weekendDays: number[];
  holidays: { date: string; name: string; nameBn: string }[];
  maxConsecutiveCl: number;
  hrReviewAboveDays: number;
  /** Calendar days a request may start in the past, for `backdateTypes` only. */
  backdateDays: number;
  backdateTypes: LeaveCode[];
  reasonMin: number;
  reasonMax: number;
}

export interface LeaveQuery {
  scope?: "mine" | "team";
  status?: RequestStatus;
  page?: number;
}
