/** Denormalised person reference embedded in module payloads (doc 03 §1.8). */
export interface PersonRef {
  id: string;
  empCode: string;
  name: string;
  nameBn: string;
  designation: string;
  designationBn: string;
  department: string;
  departmentBn: string;
  initials: string;
  avatarColor: string;
}

/** Decimal money as a string, e.g. `"4850000.00"` (doc 03 §1.5). */
export type Money = string;

export type Urgency = "CRITICAL" | "HIGH" | "NORMAL";

export type Priority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
