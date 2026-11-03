import { handleMockRequest, setMockLatency } from "../server";
import type { MockRequest } from "../http";

const device = { id: "audit-device", name: "Jest", platform: "ANDROID" as const };
const PERSONAS = ["EMP-0001", "EMP-0012", "EMP-0028", "EMP-0045", "EMP-0062", "EMP-1042", "EMP-0821"];

function req(method: MockRequest["method"], path: string, token?: string, body: unknown = null, query: Record<string, string> = {}): MockRequest {
  return { method, path, query, body, headers: token ? { authorization: `Bearer ${token}` } : {} };
}

async function tokenFor(empCode: string): Promise<string> {
  const res = await handleMockRequest(req("POST", "/__demo/session", undefined, { empCode, device }));
  return (res.body as { data: { accessToken: string } }).data.accessToken;
}

async function list<T>(token: string, path: string, query: Record<string, string> = {}): Promise<{ status: number; data: T[] }> {
  const res = await handleMockRequest(req("GET", path, token, null, query));
  const body = res.body as { data?: T[] };
  return { status: res.status, data: Array.isArray(body.data) ? body.data : [] };
}

beforeAll(() => setMockLatency(0, 0));

/**
 * Role-wise dead-link audit: every record a persona can reach from a list or a notification must open.
 * A 404 here is what the app renders as "This item no longer exists."
 */
describe.each(PERSONAS)("no dead links for %s", (empCode) => {
  it("notification deep links open", async () => {
    const token = await tokenFor(empCode);
    const { data } = await list<{ id: string; data?: { route?: string } }>(token, "/notifications");
    const dead: string[] = [];
    for (const n of data) {
      const route = n.data?.route;
      const m = route ? /^\/approvals\/(.+)$/.exec(route) : null;
      if (!m?.[1]) continue;
      const res = await handleMockRequest(req("GET", `/workflow/instances/${m[1]}`, token));
      if (res.status !== 200) dead.push(`${n.id} -> ${route} (${res.status})`);
    }
    expect(dead).toEqual([]);
  });

  it("inbox, notices and leave list rows open", async () => {
    const token = await tokenFor(empCode);
    const dead: string[] = [];
    const inbox = await list<{ instanceId?: string; id: string }>(token, "/workflow/inbox");
    for (const i of inbox.data) {
      const id = i.instanceId ?? i.id;
      const res = await handleMockRequest(req("GET", `/workflow/instances/${id}`, token));
      if (res.status !== 200) dead.push(`inbox ${id} (${res.status})`);
    }
    const notices = await list<{ id: string }>(token, "/notices");
    for (const n of notices.data) {
      const res = await handleMockRequest(req("GET", `/notices/${n.id}`, token));
      if (res.status !== 200) dead.push(`notice ${n.id} (${res.status})`);
    }
    const leave = await list<{ id: string }>(token, "/leave/requests");
    for (const l of leave.data) {
      const res = await handleMockRequest(req("GET", `/leave/requests/${l.id}`, token));
      if (res.status !== 200) dead.push(`leave ${l.id} (${res.status})`);
    }
    expect(dead).toEqual([]);
  });
});
