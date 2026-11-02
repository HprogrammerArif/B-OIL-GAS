import { z } from "zod";
import { addDays, dateKey } from "@/lib/calendar";
import { nearestFence } from "@/lib/location/haversine";
import type {
  AttendanceKpis,
  AttendanceRange,
  Geofence,
  NearestGeofence,
  PunchResponse,
  RosterFilter,
  RosterRow,
  TodayAttendance,
} from "@/types/domain/attendance";
import { nowIso } from "../clock";
import { newId } from "../crypto";
import { commit } from "../db";
import type { MockPunch } from "../db/schema";
import {
  activeEmployees,
  activeFences,
  canSeeEmployee,
  computeDay,
  createRegularisation,
  evaluatePunch,
  nextPunchType,
  overtimeMtd,
  punchWire,
  regularisationWire,
  rosterRow,
  shiftFor,
  shiftWire,
  siteRef,
  summarise,
} from "../engine/attendance";
import { notify } from "../engine/notify";
import { ATTENDANCE_POLICY } from "../engine/policy";
import { isAssignedTo } from "../engine/workflow";
import { mockEvents } from "../events";
import { HttpError, matchesSearch, ok, validationError } from "../http";
import { parse } from "../parse";
import { register, requireAuth, type HandlerContext } from "../router";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

const punchBody = z.object({
  type: z.enum(["IN", "OUT"]),
  punchedAt: z.string().datetime(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyM: z.number().min(0).nullable(),
  isMockLocation: z.boolean(),
  platform: z.enum(["ANDROID", "IOS"]),
  deviceId: z.string().min(1).max(100),
  siteId: z.string().max(64).optional(),
  fieldDutyRequested: z.boolean().optional(),
  note: z.string().trim().max(500).optional(),
});

const regularisationBody = z.object({
  date: dateStr,
  type: z.enum(["MISSED_PUNCH", "FIELD_DUTY", "LATE_JUSTIFICATION", "REMOTE_WORK"]),
  requestedIn: z.string().datetime().optional(),
  requestedOut: z.string().datetime().optional(),
  reason: z.string().trim().min(ATTENDANCE_POLICY.reasonMin, "errors:commentMin10").max(ATTENDANCE_POLICY.reasonMax),
});

const rangeQuery = z.object({ from: dateStr, to: dateStr });
const rosterQuery = z.object({
  status: z.enum(["ALL", "IN", "LATE", "NOT_IN", "ON_LEAVE", "REVIEW"]).optional(),
  q: z.string().trim().max(80).optional(),
});

function geofenceWire(ctx: HandlerContext, id: string): Geofence | null {
  const g = ctx.db.geofences.find((x) => x.id === id);
  const site = g && siteRef(ctx.db, g.siteId);
  return g && site ? { id: g.id, site, name: g.name, nameBn: g.nameBn, centerLat: g.centerLat, centerLng: g.centerLng, radiusMeters: g.radiusMeters } : null;
}

function nearestWire(ctx: HandlerContext, lat: number, lng: number): NearestGeofence | null {
  const near = nearestFence(activeFences(ctx.db), lat, lng);
  const site = near && siteRef(ctx.db, near.fence.siteId);
  if (!near || !site) return null;
  return { id: near.fence.id, site, name: near.fence.name, nameBn: near.fence.nameBn, distanceM: Math.round(near.distanceM), inside: near.inside };
}

function myEmployee(ctx: HandlerContext) {
  return requireAuth(ctx).employee;
}

/** Roster rows the caller may see under `attendance:read` (line managers always see direct reports). */
function visibleRoster(ctx: HandlerContext): RosterRow[] {
  const auth = requireAuth(ctx);
  return activeEmployees(ctx.db)
    .filter((e) => e.id === auth.employee.id || canSeeEmployee(ctx, auth, "attendance:read", e))
    .map((e) => rosterRow(ctx.db, e, auth.employee.id));
}

function matchesFilter(row: RosterRow, f: RosterFilter): boolean {
  const s = row.day.status;
  switch (f) {
    case "ALL": return true;
    case "IN": return !!row.day.firstInAt;
    case "LATE": return s === "LATE";
    case "NOT_IN": return !row.day.firstInAt && s !== "ON_LEAVE" && s !== "WEEKEND" && s !== "HOLIDAY";
    case "ON_LEAVE": return s === "ON_LEAVE";
    case "REVIEW": return row.day.flags.pendingReview;
  }
}

register([
  {
    method: "GET",
    path: "/geofences",
    handler: (ctx) => {
      requireAuth(ctx);
      return ok(ctx.db.geofences.filter((g) => g.isActive).map((g) => geofenceWire(ctx, g.id)).filter((g): g is Geofence => !!g));
    },
  },
  {
    method: "GET",
    path: "/attendance/me/today",
    permission: "attendance:punch",
    handler: (ctx) => {
      const emp = myEmployee(ctx);
      const lat = Number(ctx.query.lat);
      const lng = Number(ctx.query.lng);
      const day = computeDay(ctx.db, emp, dateKey());
      const body: TodayAttendance = {
        date: day.date,
        shift: shiftWire(shiftFor(ctx.db, emp.id)),
        day,
        nextPunchType: nextPunchType(day),
        nearestGeofence: ctx.query.lat && ctx.query.lng && Number.isFinite(lat) && Number.isFinite(lng) ? nearestWire(ctx, lat, lng) : null,
        overtimeMinutesMtd: overtimeMtd(ctx.db, emp),
      };
      return ok(body);
    },
  },
  {
    method: "GET",
    path: "/attendance/me",
    permission: "attendance:punch",
    handler: (ctx) => {
      const emp = myEmployee(ctx);
      const { from, to } = parse(rangeQuery, ctx.query);
      if (to < from) throw validationError("to", "Invalid range");
      const today = dateKey();
      const days = [];
      for (let d = to > today ? today : to; d >= from && days.length < 62; d = addDays(d, -1)) days.push(computeDay(ctx.db, emp, d));
      const body: AttendanceRange = { from, to, days, summary: summarise(days) };
      return ok(body);
    },
  },
  {
    method: "POST",
    path: "/attendance/punch",
    permission: "attendance:punch",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const emp = auth.employee;
      const body = parse(punchBody, ctx.body);
      const nowMs = Date.now();
      const claimed = Date.parse(body.punchedAt);
      // Offline replays are accepted up to 24 h; future or older timestamps fall back to server time (BR-10-03).
      const at = Number.isFinite(claimed) && claimed <= nowMs + ATTENDANCE_POLICY.clockSkewMin * 60_000 && nowMs - claimed <= 24 * 3_600_000 ? claimed : nowMs;
      const date = dateKey(new Date(at));

      const prior = ctx.db.punches.find(
        (p) => p.employeeId === emp.id && p.type === body.type && p.result !== "REJECTED_MOCK" && Math.abs(Date.parse(p.punchedAt) - at) < ATTENDANCE_POLICY.duplicateWindowMin * 60_000 && p.result === "ACCEPTED",
      );
      if (prior) {
        const fence = prior.geofenceId ? geofenceWire(ctx, prior.geofenceId) : null;
        const res: PunchResponse = {
          id: prior.id, result: prior.result,
          geofence: fence && prior.distanceM !== null ? { id: fence.id, name: fence.name, nameBn: fence.nameBn, distanceM: prior.distanceM } : null,
          day: computeDay(ctx.db, emp, prior.date), canRegularise: false, regularisationId: null, duplicate: true,
        };
        return ok(res, 201);
      }

      const verdict = evaluatePunch(ctx.db, emp.id, date, body);
      const record: MockPunch = {
        id: newId("pch"), employeeId: emp.id, date, type: body.type, punchedAt: new Date(at).toISOString(), receivedAt: nowIso(),
        lat: body.lat, lng: body.lng, accuracyM: body.accuracyM, geofenceId: verdict.fence?.id ?? null,
        siteId: verdict.fence?.siteId ?? null, distanceM: verdict.distanceM, isMockLocation: body.isMockLocation,
        deviceId: body.deviceId, platform: body.platform, result: verdict.result, fieldDuty: verdict.fieldDuty, regularisationId: null,
      };
      ctx.db.punches.push(record);

      if (verdict.result === "PENDING_REGULARISATION") {
        const existing = ctx.db.regularisations.find((r) => r.employeeId === emp.id && r.date === date && r.type === "FIELD_DUTY" && r.status === "PENDING");
        const reg =
          existing ??
          createRegularisation(ctx.db, emp.id, {
            date, type: "FIELD_DUTY", requestedIn: null, requestedOut: null,
            reason: body.note || `Punched outside the site fence (${Math.round(verdict.distanceM ?? 0)} m away) on field duty.`,
          });
        record.regularisationId = reg.id;
        if (reg.status === "APPROVED") {
          record.result = "ACCEPTED";
          record.fieldDuty = true;
        }
      }

      if (record.result.startsWith("REJECTED")) {
        notify(ctx.db, [auth.user.id], {
          type: "ATTENDANCE_PUNCH_REJECTED", priority: "HIGH", category: "PEOPLE",
          title: "Punch not accepted", titleBn: "পাঞ্চ গৃহীত হয়নি",
          body: "Your punch was rejected. You can request regularisation.", bodyBn: "আপনার পাঞ্চ বাতিল হয়েছে। নিয়মিতকরণের আবেদন করতে পারেন।",
          data: { module: "attendance", route: "/attendance" },
        });
      }
      mockEvents.emit("attendance:punch", [], { employeeId: emp.id, siteId: emp.site.id });
      commit();

      const fence = verdict.fence;
      const res: PunchResponse = {
        id: record.id,
        result: record.result,
        geofence: fence && verdict.distanceM !== null ? { id: fence.id, name: fence.name, nameBn: fence.nameBn, distanceM: verdict.distanceM } : null,
        day: computeDay(ctx.db, emp, date),
        canRegularise: record.result.startsWith("REJECTED"),
        regularisationId: record.regularisationId,
        duplicate: false,
      };
      return ok(res, 201);
    },
  },
  {
    method: "GET",
    path: "/attendance/punches/:id",
    permission: "attendance:punch",
    handler: (ctx) => {
      const p = ctx.db.punches.find((x) => x.id === ctx.params.id && x.employeeId === myEmployee(ctx).id);
      if (!p) throw new HttpError("NOT_FOUND", "Punch not found");
      return ok(punchWire(ctx.db, p));
    },
  },
  {
    method: "GET",
    path: "/attendance/live",
    permission: "attendance:read",
    handler: (ctx) => {
      const { status = "ALL", q } = parse(rosterQuery, ctx.query);
      const rows = visibleRoster(ctx)
        .filter((r) => matchesFilter(r, status))
        .filter((r) => matchesSearch(q, r.employee.name, r.employee.nameBn, r.employee.empCode, r.employee.department))
        .sort((a, b) => Number(b.isSelf) - Number(a.isSelf) || a.employee.name.localeCompare(b.employee.name));
      return ok(rows);
    },
  },
  {
    method: "GET",
    path: "/attendance/kpis",
    permission: "attendance:read",
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const rows = visibleRoster(ctx);
      const ids = new Set(rows.map((r) => r.employee.id));
      const inbox = ctx.db.workflow.filter((w) => isAssignedTo(auth, w) && ids.has(w.initiatorEmployeeId));
      const body: AttendanceKpis = {
        headcount: rows.length,
        present: rows.filter((r) => !!r.day.firstInAt).length,
        late: rows.filter((r) => r.day.status === "LATE").length,
        absent: rows.filter((r) => r.day.status === "ABSENT").length,
        notIn: rows.filter((r) => matchesFilter(r, "NOT_IN")).length,
        onLeave: rows.filter((r) => r.day.status === "ON_LEAVE").length,
        fieldDuty: rows.filter((r) => r.day.status === "FIELD_DUTY").length,
        pendingRegularisations: inbox.filter((w) => w.objectType === "Regularisation").length,
        pendingLeave: inbox.filter((w) => w.objectType === "LeaveRequest").length,
        overtimeMinutesMtd: rows.reduce((sum, r) => sum + r.overtimeMinutesMtd, 0),
      };
      return ok(body);
    },
  },
  {
    method: "POST",
    path: "/attendance/regularisations",
    permission: "attendance:punch",
    handler: (ctx) => {
      const emp = myEmployee(ctx);
      const body = parse(regularisationBody, ctx.body);
      const today = dateKey();
      const oldest = addDays(today, -ATTENDANCE_POLICY.regularisationWindowDays);
      if (body.type === "FIELD_DUTY") {
        if (body.date > addDays(today, ATTENDANCE_POLICY.fieldDutyAheadDays) || body.date < oldest) throw validationError("date", "Date is outside the allowed window");
      } else if (body.date > today || body.date < oldest) {
        throw validationError("date", `Choose a date within the last ${ATTENDANCE_POLICY.regularisationWindowDays} days`);
      }
      if (body.requestedIn && body.requestedOut && body.requestedOut <= body.requestedIn) throw validationError("requestedOut", "Out time must be after in time");
      if (body.type === "MISSED_PUNCH" && !body.requestedIn && !body.requestedOut) throw validationError("requestedIn", "Enter the missed time");
      const dup = ctx.db.regularisations.find((r) => r.employeeId === emp.id && r.date === body.date && r.type === body.type && r.status === "PENDING");
      if (dup) throw new HttpError("CONFLICT", "A request for this day is already pending", [{ rule: "DUPLICATE", refNo: dup.refNo }]);
      const reg = createRegularisation(ctx.db, emp.id, {
        date: body.date, type: body.type, requestedIn: body.requestedIn ?? null, requestedOut: body.requestedOut ?? null, reason: body.reason,
      });
      commit();
      return ok(regularisationWire(ctx.db, reg), 201);
    },
  },
  {
    method: "GET",
    path: "/attendance/regularisations",
    permission: ["attendance:punch", "attendance:approve-regularisation"],
    handler: (ctx) => {
      const auth = requireAuth(ctx);
      const team = ctx.query.scope === "team";
      const list = ctx.db.regularisations.filter((r) => {
        if (!team) return r.employeeId === auth.employee.id;
        const e = ctx.db.employees.find((x) => x.id === r.employeeId);
        return !!e && e.id !== auth.employee.id && canSeeEmployee(ctx, auth, "attendance:approve-regularisation", e);
      });
      return ok(list.map((r) => regularisationWire(ctx.db, r)));
    },
  },
]);
