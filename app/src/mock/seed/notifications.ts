import type { MockDb, MockNotification } from "../db/schema";
import { personRef } from "../engine/people";
import { activeStep, approverUsers, MODULE_OF } from "../engine/workflow";

type SeedNotification = Omit<MockNotification, "id" | "ackedAt" | "ackRequired"> & { ackRequired?: boolean };

/** Adds a seeded notification without emitting realtime events. */
export function seedNotification(db: MockDb, n: SeedNotification): void {
  db.notifications.push({
    ...n,
    id: `ntf_seed_${db.notifications.length + 1}`,
    ackRequired: n.ackRequired ?? n.priority === "CRITICAL",
    ackedAt: null,
  });
}

/** Approval notifications derived from the workflow seed (pending → approvers, decided → initiator). */
export function seedWorkflowNotifications(db: MockDb): void {
  for (const inst of db.workflow) {
    const requester = personRef(db, inst.initiatorEmployeeId);
    const step = activeStep(inst);
    if (step?.activatedAt) {
      for (const u of approverUsers(db, step)) {
        if (u.employeeId === inst.initiatorEmployeeId) continue;
        seedNotification(db, {
          userId: u.id,
          type: step.requiresSignature ? "NOTE_SHEET_SIGN_REQUIRED" : "APPROVAL_PENDING",
          priority: inst.summary.urgency === "CRITICAL" ? "HIGH" : "NORMAL",
          category: "APPROVALS",
          title: `Approval needed: ${inst.summary.refNo}`,
          titleBn: `অনুমোদন প্রয়োজন: ${inst.summary.refNo}`,
          body: `${inst.summary.title} — from ${requester.name}`,
          bodyBn: `${inst.summary.titleBn} — ${requester.nameBn}`,
          data: { module: "approvals", objectType: "WorkflowInstance", objectId: inst.id, route: `/approvals/${inst.id}` },
          readAt: inst.summary.urgency === "NORMAL" && Date.parse(step.activatedAt) < Date.now() - 24 * 3_600_000 ? step.activatedAt : null,
          createdAt: step.activatedAt,
        });
      }
    }
    if (inst.status !== "IN_REVIEW" && inst.completedAt) {
      const initiator = db.users.find((u) => u.employeeId === inst.initiatorEmployeeId);
      if (!initiator) continue;
      const returned = inst.status === "RETURNED";
      seedNotification(db, {
        userId: initiator.id,
        type: returned ? "APPROVAL_RETURNED" : "APPROVAL_DECIDED",
        priority: returned ? "HIGH" : "NORMAL",
        category: "APPROVALS",
        title: returned ? `${inst.summary.refNo} returned for correction` : `${inst.summary.refNo} approved`,
        titleBn: returned ? `${inst.summary.refNo} সংশোধনের জন্য ফেরত` : `${inst.summary.refNo} অনুমোদিত`,
        body: inst.summary.title,
        bodyBn: inst.summary.titleBn,
        data: { module: MODULE_OF[inst.objectType], objectType: inst.objectType, objectId: inst.objectId, route: `/approvals/${inst.id}` },
        readAt: returned ? null : inst.completedAt,
        createdAt: inst.completedAt,
      });
    }
  }
  db.notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
