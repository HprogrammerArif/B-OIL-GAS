import type { Money, PersonRef, Urgency } from "./common";

export type WorkflowObjectType = "NoteSheet" | "Claim" | "Requisition" | "LeaveRequest" | "Regularisation" | "AssetRequisition" | "Visit";

/** Inbox category chips (doc 03 §4.6 `?category=`). */
export type ApprovalCategory = "PROCUREMENT" | "CLAIMS" | "FLEET" | "LEAVE" | "HR" | "ASSETS" | "VISITORS";

export type InstanceStatus = "IN_REVIEW" | "APPROVED" | "REJECTED" | "RETURNED" | "WITHDRAWN";
export type StepStatus = "WAITING" | "ACTIVE" | "COMPLETED" | "SKIPPED";
export type StepDecision = "APPROVED" | "REJECTED" | "RETURNED";
export type WorkflowActionType = "SUBMIT" | "APPROVE" | "REJECT" | "RETURN" | "COMMENT" | "WITHDRAW" | "ESCALATE";

export interface WorkflowSummary {
  refNo: string;
  title: string;
  titleBn: string;
  details: string;
  detailsBn: string;
  amount: Money | null;
  /** Non-monetary quantity shown instead of an amount, e.g. "5 days". */
  quantityLabel: string | null;
  quantityLabelBn: string | null;
  requester: PersonRef;
  urgency: Urgency;
  category: ApprovalCategory;
}

export interface WorkflowStep {
  id: string;
  stepNo: number;
  key: string;
  name: string;
  nameBn: string;
  /** Resolved person when the rule names one; otherwise the role label. */
  approver: PersonRef | null;
  approverLabel: string;
  approverLabelBn: string;
  status: StepStatus;
  decision: StepDecision | null;
  comment: string | null;
  activatedAt: string | null;
  dueAt: string | null;
  decidedAt: string | null;
  decidedBy: PersonRef | null;
  requiresSignature: boolean;
  signatureHash: string | null;
}

export interface WorkflowAction {
  id: string;
  type: WorkflowActionType;
  stepNo: number | null;
  actor: PersonRef | null;
  comment: string | null;
  details: { reasonCategory?: string; improvementsRequired?: string } | null;
  at: string;
}

export interface WorkflowInstance {
  id: string;
  objectType: WorkflowObjectType;
  objectId: string;
  status: InstanceStatus;
  summary: WorkflowSummary;
  initiator: PersonRef;
  submittedAt: string;
  completedAt: string | null;
  currentStepNo: number | null;
  steps: WorkflowStep[];
  actions: WorkflowAction[];
  /** Caller-relative flags so clients never re-derive authorisation. */
  viewer: { canAct: boolean; canReturn: boolean; canWithdraw: boolean; isInitiator: boolean };
}

export interface InboxItem {
  instanceId: string;
  objectType: WorkflowObjectType;
  objectId: string;
  summary: WorkflowSummary;
  step: {
    stepNo: number;
    key: string;
    name: string;
    nameBn: string;
    activatedAt: string;
    dueAt: string;
    slaHoursLeft: number;
    requiresSignature: boolean;
  };
  submittedAt: string;
  /** True when this row is a company-pipeline view, not assigned to the caller. */
  readOnly: boolean;
}

export interface InboxSummary {
  pending: number;
  breachingIn12h: number;
  breached: number;
  totalAmount: Money;
}

export interface HistoryItem {
  instanceId: string;
  objectType: WorkflowObjectType;
  summary: WorkflowSummary;
  status: InstanceStatus;
  relation: "DECIDED" | "INITIATED";
  myDecision: StepDecision | null;
  at: string;
}

export interface InboxQuery {
  category?: ApprovalCategory;
  q?: string;
  sla?: "breached" | "12h" | "24h";
  view?: "mine" | "all";
  page?: number;
}

export type ActionRequest =
  | { type: "APPROVE"; comment?: string; signature?: { method: "TYPED"; otpCode: string } }
  | { type: "REJECT" | "RETURN"; comment: string; details?: { reasonCategory?: string; improvementsRequired?: string } }
  | { type: "COMMENT" | "WITHDRAW"; comment?: string };

export interface ActionResult {
  instance: WorkflowInstance;
  /** Voucher / reference produced by the module hook, if any. */
  reference: string | null;
}

export interface BatchActionResult {
  results: { instanceId: string; ok: boolean; error?: { code: string; message: string } }[];
}

export interface SignatureOtp {
  expiresAt: string;
  /** Mock mode only: the code, so presenters can complete the flow without SMS. */
  demoCode?: string;
}
