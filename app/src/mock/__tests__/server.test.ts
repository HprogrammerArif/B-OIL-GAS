import { handleMockRequest, setMockLatency } from "../server";
import type { MockRequest } from "../http";

const DEMO_PASSWORD = process.env.ONEOPS_DEMO_PASSWORD;
const device = { id: "test-device", name: "Jest", platform: "ANDROID" as const };

function req(method: MockRequest["method"], path: string, body: unknown = null, token?: string): MockRequest {
  return { method, path, query: {}, body, headers: token ? { authorization: `Bearer ${token}` } : {} };
}

async function personaSession(empCode: string) {
  const res = await handleMockRequest(req("POST", "/__demo/session", { empCode, device }));
  expect(res.status).toBe(200);
  return (res.body as { data: { accessToken: string; refreshToken: string } }).data;
}

beforeAll(() => setMockLatency(0, 0));

describe("mock auth", () => {
  it("rejects unknown identifiers with the same generic error as a wrong password", async () => {
    const unknown = await handleMockRequest(req("POST", "/auth/login", { identifier: "nobody@x.com", password: "whatever1", device }));
    const wrong = await handleMockRequest(req("POST", "/auth/login", { identifier: "EMP-1042", password: "whatever1", device }));
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body).toMatchObject({ error: { code: "UNAUTHENTICATED", message: "Invalid credentials" } });
    expect(wrong.body).toMatchObject({ error: { code: "UNAUTHENTICATED", message: "Invalid credentials" } });
  });

  it("locks the account after five failures", async () => {
    for (let i = 0; i < 5; i += 1) {
      await handleMockRequest(req("POST", "/auth/login", { identifier: "EMP-0821", password: "bad-pass-1", device }));
    }
    const res = await handleMockRequest(req("POST", "/auth/login", { identifier: "EMP-0821", password: "bad-pass-1", device }));
    expect(res.body).toMatchObject({ error: { details: [{ reason: "ACCOUNT_LOCKED" }] } });
  });

  (DEMO_PASSWORD ? it : it.skip)("signs in by employee code, email or phone", async () => {
    for (const identifier of ["EMP-1042", "tanvir.sales@bashundhara.com", "+880 1712-334455"]) {
      const res = await handleMockRequest(req("POST", "/auth/login", { identifier, password: DEMO_PASSWORD, device }));
      expect(res.status).toBe(200);
    }
  });

  it("rotates refresh tokens and rejects reuse of the old one", async () => {
    const first = await personaSession("EMP-1042");
    const rotated = await handleMockRequest(req("POST", "/auth/refresh", { refreshToken: first.refreshToken }));
    expect(rotated.status).toBe(200);
    const reused = await handleMockRequest(req("POST", "/auth/refresh", { refreshToken: first.refreshToken }));
    expect(reused.status).toBe(401);
  });

  it("revokes the session on logout", async () => {
    const s = await personaSession("EMP-1042");
    expect((await handleMockRequest(req("POST", "/auth/logout", null, s.accessToken))).status).toBe(204);
    expect((await handleMockRequest(req("GET", "/me", null, s.accessToken))).status).toBe(401);
  });

  it("requires a bearer token for /me", async () => {
    expect((await handleMockRequest(req("GET", "/me"))).status).toBe(401);
  });
});

describe("mock permissions", () => {
  const expected: Record<string, string[]> = {
    "EMP-0001": ["dashboards", "approvals", "notices", "note-sheets", "attendance", "leave", "claims", "parcels", "visitors", "incidents", "assets", "compliance", "employees", "chat"],
    "EMP-0012": ["dashboards", "approvals", "notices", "note-sheets", "attendance", "leave", "claims", "parcels", "visitors", "incidents", "assets", "compliance", "chat"],
    "EMP-0028": ["dashboards", "approvals", "notices", "note-sheets", "attendance", "leave", "claims", "fleet", "bus", "parcels", "visitors", "incidents", "assets", "compliance", "employees", "chat"],
    "EMP-0045": ["dashboards", "approvals", "notices", "note-sheets", "attendance", "leave", "claims", "fleet", "bus", "parcels", "visitors", "incidents", "assets"],
    "EMP-0062": ["dashboards", "approvals", "notices", "note-sheets", "attendance", "leave", "claims", "fleet", "parcels", "visitors", "incidents", "assets", "compliance", "employees", "chat"],
    "EMP-1042": ["dashboards", "notices", "note-sheets", "attendance", "leave", "claims", "fleet", "bus", "parcels", "visitors", "incidents", "assets"],
    "EMP-0821": ["dashboards", "notices", "note-sheets", "attendance", "leave", "claims", "fleet", "parcels", "incidents", "assets"],
  };

  it.each(Object.entries(expected))("%s sees the same modules as the web prototype", async (empCode, modules) => {
    const s = await personaSession(empCode);
    const res = await handleMockRequest(req("GET", "/me/permissions", null, s.accessToken));
    const nav = (res.body as { data: { navigation: string[] } }).data.navigation;
    expect([...nav].sort()).toEqual([...modules].sort());
  });
});
