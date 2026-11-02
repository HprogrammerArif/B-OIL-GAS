import { handleMockRequest, setMockLatency } from "../server";
import type { MockRequest } from "../http";
import type { ActiveBroadcast, ComposeOptions, Notice, NoticeListItem } from "@/types/domain/notice";
import type { AppNotification } from "@/types/domain/notification";

const device = { id: "test-device", name: "Jest", platform: "ANDROID" as const };

function req(method: MockRequest["method"], path: string, token?: string, body: unknown = null, query: Record<string, string> = {}): MockRequest {
  return { method, path, query, body, headers: token ? { authorization: `Bearer ${token}` } : {} };
}

async function tokenFor(empCode: string): Promise<string> {
  const res = await handleMockRequest(req("POST", "/__demo/session", undefined, { empCode, device }));
  return (res.body as { data: { accessToken: string } }).data.accessToken;
}

async function list(token: string, query: Record<string, string> = {}): Promise<NoticeListItem[]> {
  const res = await handleMockRequest(req("GET", "/notices", token, null, query));
  return (res.body as { data: NoticeListItem[] }).data;
}

const data = <T>(res: { body: unknown }) => (res.body as { data: T }).data;

const draft = {
  title: "Night shift hydration reminder",
  body: "Carry water and take a break every two hours during the night shift.",
  category: "SAFETY",
  priority: "NORMAL",
  isPinned: false,
  requiresAck: false,
  audiences: [{ type: "SITE", refId: "site_plant" }],
  channels: ["IN_APP"],
};

beforeAll(() => setMockLatency(0, 0));

describe("notice feed", () => {
  it("shows only notices addressed to the caller, pinned first", async () => {
    const tanvir = await list(await tokenFor("EMP-1042"));
    expect(tanvir.map((n) => n.refNo)).not.toContainEqual(expect.stringMatching(/-0089$/));
    expect(tanvir[0]?.isPinned).toBe(true);
    const kamruzzaman = await list(await tokenFor("EMP-0045"));
    expect(kamruzzaman.some((n) => n.refNo.endsWith("-0089"))).toBe(true);
  });

  it("reports organisation-wide totals including staff without accounts", async () => {
    const items = await list(await tokenFor("EMP-0045"));
    const safety = items.find((n) => n.refNo.endsWith("-0089"));
    expect(safety).toMatchObject({ recipientCount: 218, ackCount: 184 });
  });

  it("hides a notice from non-recipients with 404", async () => {
    const res = await handleMockRequest(req("GET", "/notices/ntc_" + new Date().getFullYear() + "_0089", await tokenFor("EMP-1042")));
    expect(res.status).toBe(404);
  });

  it("marks the receipt and its notification read when opened", async () => {
    const token = await tokenFor("EMP-0045");
    const target = (await list(token, { unread: "true" })).find((n) => n.refNo.endsWith("-0090"));
    expect(target).toBeDefined();
    await handleMockRequest(req("GET", `/notices/${target!.id}`, token));
    expect((await list(token, { unread: "true" })).some((n) => n.id === target!.id)).toBe(false);
    const ntf = data<AppNotification[]>(await handleMockRequest(req("GET", "/notifications", token)));
    expect(ntf.find((n) => n.data.objectId === target!.id)?.readAt).not.toBeNull();
  });
});

describe("acknowledgement", () => {
  it("records an acknowledgement once and rejects it where not required", async () => {
    const token = await tokenFor("EMP-1042");
    const pending = await list(token, { requiresAck: "true" });
    const medical = pending.find((n) => n.refNo.endsWith("-0087"))!;
    const first = data<Notice>(await handleMockRequest(req("POST", `/notices/${medical.id}/ack`, token)));
    expect(first.receipt?.ackedAt).not.toBeNull();
    expect(first.ackCount).toBe(medical.ackCount + 1);
    const again = data<Notice>(await handleMockRequest(req("POST", `/notices/${medical.id}/ack`, token)));
    expect(again.ackCount).toBe(first.ackCount);

    const holiday = (await list(token)).find((n) => n.refNo.endsWith("-0086"))!;
    const res = await handleMockRequest(req("POST", `/notices/${holiday.id}/ack`, token));
    expect(res.body).toMatchObject({ error: { code: "POLICY_VIOLATION", details: [{ rule: "ACK_NOT_REQUIRED" }] } });
  });

  it("acknowledges a critical notice through its blocking notification", async () => {
    const token = await tokenFor("EMP-0045");
    const ntf = data<AppNotification[]>(await handleMockRequest(req("GET", "/notifications", token)));
    const critical = ntf.find((n) => n.ackRequired && !n.ackedAt && n.data.objectType === "Notice")!;
    expect(critical).toBeDefined();

    await handleMockRequest(req("GET", `/notices/${critical.data.objectId}`, token));
    const count = data<{ critical: number }>(await handleMockRequest(req("GET", "/notifications/unread-count", token)));
    expect(count.critical).toBeGreaterThan(0);

    await handleMockRequest(req("POST", `/notifications/${critical.id}/ack`, token));
    const notice = data<Notice>(await handleMockRequest(req("GET", `/notices/${critical.data.objectId}`, token)));
    expect(notice.receipt?.ackedAt).not.toBeNull();
    expect(notice.viewer.canAck).toBe(false);
  });
});

describe("publishing", () => {
  it("limits a plant GM to plant categories and site audiences", async () => {
    const options = data<ComposeOptions>(await handleMockRequest(req("GET", "/notices/compose-options", await tokenFor("EMP-0012"))));
    expect(options.categories).toEqual(expect.arrayContaining(["SAFETY", "OPERATIONS"]));
    expect(options.categories).not.toContain("EXECUTIVE");
    expect(options.audiences.map((a) => a.refId)).toEqual(expect.arrayContaining(["site_plant", "dept_plant"]));
    expect(options.audiences.some((a) => a.type === "ALL")).toBe(false);
  });

  it("forbids publishing outside the caller's scope", async () => {
    const token = await tokenFor("EMP-0012");
    const res = await handleMockRequest(req("POST", "/notices", token, { ...draft, audiences: [{ type: "ALL", refId: null }] }));
    expect(res.status).toBe(403);
    const exec = await handleMockRequest(req("POST", "/notices", token, { ...draft, category: "EXECUTIVE" }));
    expect(exec.status).toBe(403);
  });

  it("denies compose to employees without publish rights", async () => {
    const res = await handleMockRequest(req("GET", "/notices/compose-options", await tokenFor("EMP-1042")));
    expect(res.status).toBe(403);
  });

  it("publishes to the audience snapshot and notifies recipients", async () => {
    const gm = await tokenFor("EMP-0012");
    const created = data<Notice>(await handleMockRequest(req("POST", "/notices", gm, draft)));
    expect(created.status).toBe("DRAFT");
    expect(created.refNo).toMatch(/^NOT-\d{4}-\d{4}$/);
    const published = data<Notice>(await handleMockRequest(req("POST", `/notices/${created.id}/publish`, gm)));
    expect(published.status).toBe("PUBLISHED");
    expect(published.recipientCount).toBe(218);

    const kz = await tokenFor("EMP-0045");
    expect((await list(kz)).some((n) => n.id === created.id)).toBe(true);
    expect((await list(await tokenFor("EMP-1042"))).some((n) => n.id === created.id)).toBe(false);

    const again = await handleMockRequest(req("POST", `/notices/${created.id}/publish`, gm));
    expect(again.status).toBe(409);
  });

  it("enforces the five-pin limit", async () => {
    const hr = await tokenFor("EMP-0028");
    const pinned = (await list(hr)).filter((n) => n.isPinned).length;
    for (let i = pinned; i < 5; i++) {
      const n = data<Notice>(await handleMockRequest(req("POST", "/notices", hr, { ...draft, category: "HR", isPinned: true, audiences: [{ type: "ALL", refId: null }] })));
      await handleMockRequest(req("POST", `/notices/${n.id}/publish`, hr));
    }
    const res = await handleMockRequest(req("POST", "/notices", hr, { ...draft, category: "HR", isPinned: true, audiences: [{ type: "ALL", refId: null }] }));
    expect(res.body).toMatchObject({ error: { details: [{ rule: "PIN_LIMIT" }] } });
  });
});

describe("broadcasts", () => {
  it("reaches everyone until acknowledged, and only then can be dismissed", async () => {
    const chairman = await tokenFor("EMP-0001");
    const created = await handleMockRequest(
      req("POST", "/broadcasts", chairman, {
        title: "180 Days Accident-Free Milestone at Keraniganj Plant",
        body: "Thank you to every engineer, operator, driver, and office team member for keeping safety first.",
        requiresAck: true,
        sendSms: false,
      }),
    );
    expect(created.status).toBe(201);

    const driver = await tokenFor("EMP-0821");
    const active = data<ActiveBroadcast | null>(await handleMockRequest(req("GET", "/broadcasts/active", driver)));
    expect(active?.requiresAck).toBe(true);
    const early = await handleMockRequest(req("POST", `/broadcasts/${active!.id}/dismiss`, driver));
    expect(early.body).toMatchObject({ error: { details: [{ rule: "ACK_REQUIRED" }] } });

    await handleMockRequest(req("POST", `/notices/${active!.noticeId}/ack`, driver));
    expect(data<ActiveBroadcast | null>(await handleMockRequest(req("GET", "/broadcasts/active", driver)))).toBeNull();
  });

  it("is reserved for notices:broadcast", async () => {
    const res = await handleMockRequest(req("POST", "/broadcasts", await tokenFor("EMP-0028"), { title: "Hello team", body: "Not allowed here at all.", requiresAck: false, sendSms: false }));
    expect(res.status).toBe(403);
  });
});
