/** MOD-11/12 claims wire shapes (doc 03 §17). Money is a decimal string. TOUR_EVENT and advances are not on mobile yet. */
import type { Money, PersonRef } from "./common";
import type { WorkflowInstance } from "./workflow";

export type ClaimType = "TADA" | "CONVEYANCE";

export type ClaimStatus =
  | "DRAFT"
  | "PENDING_MANAGER"
  | "PENDING_FINANCE"
  | "APPROVED"
  | "RETURNED"
  | "REJECTED"
  | "SETTLED"
  | "CANCELLED";

export type ClaimCategory = "DA" | "HOTEL" | "TRANSPORT" | "FUEL" | "MEALS" | "RICKSHAW" | "CNG" | "RIDE_SHARE" | "MILEAGE" | "OTHER";

export type TravelMode = "AC_BUS" | "BUS" | "TRAIN" | "AC_TRAIN" | "FIRST_CLASS_TRAIN" | "CNG" | "RIDE_SHARE" | "RICKSHAW" | "POOL_CAR" | "COMPANY_CAR" | "DOMESTIC_AIR";

export interface ClaimLine {
  id: string;
  date: string;
  category: ClaimCategory;
  description: string;
  fromPlace: string | null;
  toPlace: string | null;
  distanceKm: number | null;
  amount: Money;
  isDeclaration: boolean;
  receiptFileId: string | null;
}

export type PolicyFlagSeverity = "WARN" | "BLOCK";

export interface PolicyFlag {
  lineId: string | null;
  rule: string;
  severity: PolicyFlagSeverity;
  message: string;
  /** Interpolation values for the localised message. */
  params?: Record<string, string | number>;
}

export interface ClaimItem {
  id: string;
  claimNo: string;
  type: ClaimType;
  purpose: string;
  destination: string | null;
  periodStart: string;
  periodEnd: string;
  status: ClaimStatus;
  totalAmount: Money;
  policyAmount: Money;
  createdAt: string;
  workflowInstanceId: string | null;
}

export interface ClaimDetail extends ClaimItem {
  claimant: PersonRef;
  travelMode: TravelMode | null;
  costCenter: string | null;
  lines: ClaimLine[];
  policyFlags: PolicyFlag[];
  voucherNo: string | null;
  workflow: WorkflowInstance | null;
  viewer: { isOwner: boolean; canWithdraw: boolean };
}

export interface ClaimLineInput {
  date: string;
  category: ClaimCategory;
  description: string;
  fromPlace?: string | null;
  toPlace?: string | null;
  distanceKm?: number | null;
  amount?: string;
  isDeclaration?: boolean;
  receiptFileId?: string | null;
}

export interface CreateClaimRequest {
  type: ClaimType;
  purpose: string;
  destination?: string | null;
  periodStart: string;
  periodEnd: string;
  travelMode?: TravelMode | null;
  lines: ClaimLineInput[];
}

/** Dry-run result used for live totals and warnings while filling the form. */
export interface ClaimComputation {
  lines: ClaimLine[];
  totalAmount: Money;
  policyAmount: Money;
  policyFlags: PolicyFlag[];
  blocked: boolean;
}

export interface ClaimPolicy {
  band: string;
  daDhaka: Money;
  daDistrict: Money;
  halfDayPct: number;
  hotelCapPerNight: Money | null;
  conveyanceMonthlyCap: Money;
  conveyanceUsedMonth: Money;
  mileageRatePerKm: Money;
  allowedTravelModes: TravelMode[];
  receiptRequiredAbove: Money;
  declarationMaxAmount: Money;
  declarationCategories: ClaimCategory[];
  submitWithinDays: number;
}

export interface ClaimQuery {
  status?: ClaimStatus;
  page?: number;
}
