import type { Urgency } from "@/types/domain/common";
import type { DepartmentRef, Lang, MeEmployee, RoleKey, SiteRef } from "@/types/domain/identity";
import type { AppNotification } from "@/types/domain/notification";
import type {
  ApprovalCategory,
  InstanceStatus,
  StepDecision,
  StepStatus,
  WorkflowActionType,
  WorkflowObjectType,
} from "@/types/domain/workflow";

export interface MockEmployee extends MeEmployee {
  userId: string | null;
  email: string;
  sapPernr: string;
  nationalId: string;
  emergencyContact: string;
  exitDate: string | null;
  exitReason: string | null;
  clearance: {
    itAccessRevoked: boolean;
    rfidGateBadgeSurrendered: boolean;
    vehicleFuelCardReturned: boolean;
    financeAccountsSettled: boolean;
    clearedBy: string | null;
    clearedAt: string | null;
    notes: string | null;
  } | null;
}

export interface MockUser {
  id: string;
  email: string;
  phone: string;
  employeeId: string;
  roles: RoleKey[];
  passwordDigest: string;
  preferredLang: Lang;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  failedAttempts: number;
  lockedUntil: string | null;
  isActive: boolean;
}

export interface MockSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  platform: "ANDROID" | "IOS";
  refreshTokenHash: string;
  accessToken: string;
  accessExpiresAt: number;
  refreshExpiresAt: string;
  createdAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
}

export interface MockPreferences {
  lang: Lang;
  theme: "LIGHT" | "DARK" | "SYSTEM";
  notifications: { channels: ("IN_APP" | "PUSH" | "SMS" | "EMAIL")[]; quietStart: string | null; quietEnd: string | null };
}

/* ─── Workflow engine (doc 02 WorkflowInstance / WorkflowStep / WorkflowAction) ─── */

export interface MockWfStep {
  id: string;
  stepNo: number;
  key: string;
  name: string;
  nameBn: string;
  /** Exactly one of role or employee is set (rule ROLE vs USER/LINE_MANAGER resolved at submit). */
  approverRole: RoleKey | null;
  approverEmployeeId: string | null;
  slaHours: number;
  requiresSignature: boolean;
  status: StepStatus;
  decision: StepDecision | null;
  comment: string | null;
  activatedAt: string | null;
  dueAt: string | null;
  decidedAt: string | null;
  decidedByEmployeeId: string | null;
  signatureHash: string | null;
}

export interface MockWfAction {
  id: string;
  type: WorkflowActionType;
  stepNo: number | null;
  actorEmployeeId: string | null;
  comment: string | null;
  details: { reasonCategory?: string; improvementsRequired?: string } | null;
  at: string;
}

export interface MockWfInstance {
  id: string;
  objectType: WorkflowObjectType;
  objectId: string;
  status: InstanceStatus;
  initiatorEmployeeId: string;
  summary: {
    refNo: string;
    title: string;
    titleBn: string;
    details: string;
    detailsBn: string;
    amount: string | null;
    quantityLabel: string | null;
    quantityLabelBn: string | null;
    urgency: Urgency;
    category: ApprovalCategory;
  };
  submittedAt: string;
  completedAt: string | null;
  steps: MockWfStep[];
  actions: MockWfAction[];
}

export interface MockOtp {
  userId: string;
  purpose: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
}

export interface MockNotification extends AppNotification {
  userId: string;
}

/**
 * Whole in-app database. Module tables are added alongside their handlers;
 * bump `MOCK_DB_VERSION` whenever a table shape changes so devices reseed.
 */
export interface MockDb {
  version: number;
  seededAt: string;
  counters: Record<string, number>;
  sites: SiteRef[];
  departments: DepartmentRef[];
  employees: MockEmployee[];
  users: MockUser[];
  sessions: MockSession[];
  preferences: Record<string, MockPreferences>;
  workflow: MockWfInstance[];
  otps: MockOtp[];
  notifications: MockNotification[];
}

export const MOCK_DB_VERSION = 2;
