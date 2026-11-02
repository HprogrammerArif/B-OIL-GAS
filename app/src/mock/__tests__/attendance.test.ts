import { distanceMeters } from "@/lib/location/haversine";
import type { AttendanceKpis, PunchResponse, RosterRow, TodayAttendance } from "@/types/domain/attendance";
import type { LeaveBalance, LeaveRequestDetail, LeaveType } from "@/types/domain/leave";
import type { InboxItem } from "@/types/domain/workflow";
import { dateKey, nthBusinessDay } from "@/lib/calendar";
import { WORK_CALENDAR } from "../engine/policy";
import type { MockRequest } from "../http";
import { handleMockRequest, setMockLatency } from "../server";

const device = { id: "test-device", name: "Jest", platform: "ANDROID" as const };

function req(method: MockRequest["method"], path: string, token?: string, body: unknown = null, query: Record<string, string> = {}): MockRequest {
  return { method, path, query, body, headers: token ? { authorization: `Bearer ${token}` } : {} };
}

async function tokenFor(empCode: string): Promise<string> {
  const res = await handleMockRequest(req("POST", "/__demo/session", undefined, { empCode, device }));
  return (res.body as { data: { accessToken: string } }).data.accessToken;
}

const data = <T>(res: { body: unknown }) => (res.body as { data: T }).data;

const HQ = { lat: 23.8103, lng: 90.4125 };
const punchBody = (over: Record<string, unknown> = {}) => ({
  type: "IN", punchedAt: new Date().toISOString(), lat: HQ.lat + 0.0005, lng: HQ.lng, accuracyM: 12,
  isMockLocation: false, platform: "ANDROID", deviceId: "test-device", ...over,
});

beforeAll(() => setMockLatency(0, 0));

describe("haversine", () => {
  it("matches the doc 06 worked example (~391 m)", () => {
    expect(Math.round(distanceMeters(23.7, 90.35, 23.703, 90.352))).toBeGreaterThanOrEqual(389);
    expect(Math.round(distanceMeters(23.7, 90.35, 23.703, 90.352))).toBeLessThanOrEqual(392);
  });
});

describe("punch verdicts", () => {
  it("accepts a punch inside the HQ fence", async () => {
    const t = await tokenFor("EMP-1042");
    const res = await handleMockRequest(req("POST", "/attendance/punch", t, punchBody()));
    expect(res.status).toBe(201);
    expect(data<PunchResponse>(res)).toMatchObject({ result: "ACCEPTED", canRegularise: false });
  });

  it("treats a repeat of the same type within 5 minutes as a no-op", async () => {
    const t = await tokenFor("EMP-0821");
    const first = data<PunchResponse>(await handleMockRequest(req("POST", "/attendance/punch", t, punchBody())));
    const again = data<PunchResponse>(await handleMockRequest(req("POST", "/attendance/punch", t, punchBody())));
    expect(again.duplicate).toBe(true);
    expect(again.id).toBe(first.id);
  });

  it("rejects weak accuracy, and mock location takes precedence", async () => {
    const t = await tokenFor("EMP-0062");
    const weak = await handleMockRequest(req("POST", "/attendance/punch", t, punchBody({ accuracyM: 65 })));
    expect(data<PunchResponse>(weak)).toMatchObject({ result: "REJECTED_ACCURACY", canRegularise: true });
    const mock = await handleMockRequest(req("POST", "/attendance/punch", t, punchBody({ accuracyM: 65, isMockLocation: true })));
    expect(data<PunchResponse>(mock).result).toBe("REJECTED_MOCK");
  });

  it("rejects outside every fence, or queues field duty for review", async () => {
    const t = await tokenFor("EMP-0028");
    const far = punchBody({ lat: 23.9, lng: 90.5, punchedAt: new Date().toISOString() });
    const rejected = data<PunchResponse>(await handleMockRequest(req("POST", "/attendance/punch", t, far)));
    expect(rejected.result).toBe("REJECTED_OUTSIDE_FENCE");
    const queued = data<PunchResponse>(await handleMockRequest(req("POST", "/attendance/punch", t, { ...far, type: "OUT", fieldDutyRequested: true })));
    expect(queued.result).toBe("PENDING_REGULARISATION");
    expect(queued.regularisationId).toBeTruthy();
  });

  it("tracks today's state and the next punch type", async () => {
    const t = await tokenFor("EMP-1042");
    const today = data<TodayAttendance>(await handleMockRequest(req("GET", "/attendance/me/today", t, null, { lat: String(HQ.lat), lng: String(HQ.lng) })));
    expect(today.nextPunchType).toBe("OUT");
    expect(today.nearestGeofence?.inside).toBe(true);
  });
});

describe("attendance scope", () => {
  it("denies the roster to plain employees and scopes line managers to their team", async () => {
    const tanvir = await handleMockRequest(req("GET", "/attendance/live", await tokenFor("EMP-1042")));
    expect(tanvir.status).toBe(200);
    expect(data<RosterRow[]>(tanvir).every((r) => r.isSelf)).toBe(true);
    const kz = data<RosterRow[]>(await handleMockRequest(req("GET", "/attendance/live", await tokenFor("EMP-0045"))));
    expect(kz.map((r) => r.employee.empCode).sort()).toEqual(["EMP-0045", "EMP-0821", "EMP-0914"]);
  });

  it("gives the chairman the company roster and KPIs", async () => {
    const t = await tokenFor("EMP-0001");
    const kpis = data<AttendanceKpis>(await handleMockRequest(req("GET", "/attendance/kpis", t)));
    expect(kpis.headcount).toBeGreaterThan(8);
  });
});

describe("leave", () => {
  const nextMonday = () => nthBusinessDay(dateKey(new Date(Date.now() + 7 * 86_400_000)), 1, WORK_CALENDAR);

  async function typeId(t: string, code: string) {
    const types = data<LeaveType[]>(await handleMockRequest(req("GET", "/leave/types", t)));
    return types.find((x) => x.code === code)!.id;
  }

  it("reports balances, holds pending days and enforces the remaining balance", async () => {
    const t = await tokenFor("EMP-0821");
    const cl = () => handleMockRequest(req("GET", "/leave/balances", t)).then((r) => data<LeaveBalance[]>(r).find((b) => b.leaveType.code === "CL")!);
    expect((await cl()).available).toBe(5);
    const start = nextMonday();
    const file = (s: string, e: string) =>
      handleMockRequest(req("POST", "/leave/requests", t, { leaveTypeId: "lt_cl", startDate: s, endDate: e, halfDay: null, reason: "Family event" }));
    expect((await file(start, nthBusinessDay(start, 3, WORK_CALENDAR))).status).toBe(201);
    expect(await cl()).toMatchObject({ pending: 3, available: 2 });
    const later = nthBusinessDay(start, 10, WORK_CALENDAR);
    const over = await file(later, nthBusinessDay(later, 3, WORK_CALENDAR));
    expect(over.body).toMatchObject({ error: { code: "POLICY_VIOLATION", details: [{ rule: "INSUFFICIENT_BALANCE" }] } });
  });

  it("caps consecutive casual leave and blocks overlaps", async () => {
    const t = await tokenFor("EMP-1042");
    const start = nextMonday();
    const cl = await typeId(t, "CL");
    const end = nthBusinessDay(start, 4, WORK_CALENDAR);
    const tooLong = await handleMockRequest(req("POST", "/leave/requests", t, { leaveTypeId: cl, startDate: start, endDate: end, halfDay: null, reason: "Long weekend" }));
    expect(tooLong.body).toMatchObject({ error: { code: "POLICY_VIOLATION" } });
    const ok1 = await handleMockRequest(req("POST", "/leave/requests", t, { leaveTypeId: cl, startDate: start, endDate: start, halfDay: "FIRST", reason: "Doctor visit" }));
    expect(data<LeaveRequestDetail>(ok1).days).toBe(0.5);
    const overlap = await handleMockRequest(req("POST", "/leave/requests", t, { leaveTypeId: cl, startDate: start, endDate: start, halfDay: null, reason: "Another one" }));
    expect(overlap.body).toMatchObject({ error: { code: "CONFLICT" } });
  });

  it("routes a long earned-leave request through line manager then HR", async () => {
    const t = await tokenFor("EMP-1042");
    const start = nthBusinessDay(dateKey(new Date(Date.now() + 21 * 86_400_000)), 1, WORK_CALENDAR);
    const end = nthBusinessDay(start, 6, WORK_CALENDAR);
    const created = data<LeaveRequestDetail>(await handleMockRequest(req("POST", "/leave/requests", t, { leaveTypeId: await typeId(t, "EL"), startDate: start, endDate: end, halfDay: null, reason: "Annual family trip" })));
    expect(created.workflow?.steps.map((s) => s.key)).toEqual(["LINE_MANAGER", "HR_REVIEW"]);

    const farida = await tokenFor("EMP-0062");
    const inbox = data<InboxItem[]>(await handleMockRequest(req("GET", "/workflow/inbox", farida)));
    expect(inbox.some((i) => i.objectId === created.id)).toBe(true);
    const approved = await handleMockRequest(req("POST", `/workflow/instances/${created.workflowInstanceId}/actions`, farida, { type: "APPROVE" }));
    expect(approved.status).toBe(200);
    const afroza = await tokenFor("EMP-0028");
    await handleMockRequest(req("POST", `/workflow/instances/${created.workflowInstanceId}/actions`, afroza, { type: "APPROVE" }));
    const detail = data<LeaveRequestDetail>(await handleMockRequest(req("GET", `/leave/requests/${created.id}`, t)));
    expect(detail.status).toBe("APPROVED");
    const balance = data<LeaveBalance[]>(await handleMockRequest(req("GET", "/leave/balances", t))).find((b) => b.leaveType.code === "EL")!;
    expect(balance.used).toBe(5 + 6);

    const cancelled = data<LeaveRequestDetail>(await handleMockRequest(req("POST", `/leave/requests/${created.id}/cancel`, t, {})));
    expect(cancelled.status).toBe("CANCELLED");
    const after = data<LeaveBalance[]>(await handleMockRequest(req("GET", "/leave/balances", t))).find((b) => b.leaveType.code === "EL")!;
    expect(after.used).toBe(5);
  });

  it("does not offer Return on leave approvals", async () => {
    const farida = await tokenFor("EMP-0062");
    const res = await handleMockRequest(req("POST", "/workflow/instances/wfi_lv_2026_089/actions", farida, { type: "RETURN", comment: "Please add the certificate" }));
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ error: { details: [{ rule: "RETURN_NOT_SUPPORTED" }] } });
  });
});
