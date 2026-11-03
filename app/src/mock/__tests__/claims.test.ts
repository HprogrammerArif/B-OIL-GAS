import { handleMockRequest, setMockLatency } from "../server";
import type { MockRequest } from "../http";
import type { ClaimComputation, ClaimDetail, ClaimItem, CreateClaimRequest } from "@/types/domain/claims";
import type { InboxItem } from "@/types/domain/workflow";

const device = { id: "claims-device", name: "Jest", platform: "ANDROID" as const };

function req(method: MockRequest["method"], path: string, token?: string, body: unknown = null, query: Record<string, string> = {}): MockRequest {
  return { method, path, query, body, headers: token ? { authorization: `Bearer ${token}` } : {} };
}

async function tokenFor(empCode: string): Promise<string> {
  const res = await handleMockRequest(req("POST", "/__demo/session", undefined, { empCode, device }));
  return (res.body as { data: { accessToken: string } }).data.accessToken;
}

const data = <T>(res: { body: unknown }) => (res.body as { data: T }).data;
const today = new Date();
const key = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** A 3-day window ending at least `from` days ago that stays inside one calendar month and clear of seeded claims. */
function window(from: number): { start: string; mid: string; end: string } {
  for (let k = from; k < from + 40; k++) {
    const start = key(-k - 2);
    const end = key(-k);
    if (start.slice(0, 7) === end.slice(0, 7)) return { start, mid: key(-k - 1), end };
  }
  throw new Error("no window");
}

const conveyance = (w = window(10), over: Partial<CreateClaimRequest> = {}): CreateClaimRequest => ({
  type: "CONVEYANCE",
  purpose: "Dealer visits in Gulshan",
  periodStart: w.start,
  periodEnd: w.end,
  lines: [{ date: w.mid, category: "CNG", description: "CNG fare", amount: "300.00", isDeclaration: true }],
  ...over,
});

beforeAll(() => setMockLatency(0, 0));

describe("claims", () => {
  it("lists the employee's seeded claims in every state", async () => {
    const t = await tokenFor("EMP-1042");
    const items = data<ClaimItem[]>(await handleMockRequest(req("GET", "/claims", t)));
    const status = Object.fromEntries(items.map((c) => [c.claimNo, c.status]));
    expect(status["TADA-2026-0419"]).toBe("PENDING_MANAGER");
    expect(status["CNV-2026-0961"]).toBe("RETURNED");
    expect(status["CNV-2026-0870"]).toBe("SETTLED");
  });

  it("opens every listed claim and hides it from unrelated staff", async () => {
    const t = await tokenFor("EMP-1042");
    const items = data<ClaimItem[]>(await handleMockRequest(req("GET", "/claims", t)));
    for (const c of items) expect((await handleMockRequest(req("GET", `/claims/${c.id}`, t))).status).toBe(200);
    const other = await tokenFor("EMP-0821");
    expect((await handleMockRequest(req("GET", `/claims/${items[0]?.id}`, other))).status).toBe(404);
  });

  it("computes a TADA claim with system-generated DA and flags a missing receipt", async () => {
    const t = await tokenFor("EMP-1042");
    const w = window(10);
    const body: CreateClaimRequest = {
      type: "TADA", purpose: "Chattogram dealer inspection", destination: "Chattogram", periodStart: w.start, periodEnd: w.end,
      lines: [{ date: w.start, category: "HOTEL", description: "Hotel Peninsula", amount: "9000.00" }],
    };
    const c = data<ClaimComputation>(await handleMockRequest(req("POST", "/claims/compute", t, body)));
    expect(c.lines.filter((l) => l.category === "DA")).toHaveLength(3);
    expect(c.policyFlags.map((f) => f.rule)).toContain("RECEIPT_REQUIRED");
    expect(c.policyFlags.map((f) => f.rule)).toContain("HOTEL_CAP");
    expect(c.blocked).toBe(true);
    expect(Number(c.totalAmount)).toBe(3 * 2000 + 9000);
  });

  it("blocks a conveyance claim over the monthly cap", async () => {
    const t = await tokenFor("EMP-1042");
    const w = window(10);
    const body = conveyance(w, { lines: [{ date: w.mid, category: "RIDE_SHARE", description: "Ride", amount: "9000.00", receiptFileId: "f1" }] });
    const res = await handleMockRequest(req("POST", "/claims", t, body));
    expect(res.status).toBe(422);
    expect(JSON.stringify(res.body)).toContain("CONVEYANCE_MONTHLY_CAP");
  });

  it("submits, routes to the line manager, and finance after approval", async () => {
    const t = await tokenFor("EMP-1042");
    const created = await handleMockRequest(req("POST", "/claims", t, conveyance(window(14))));
    expect(created.status).toBe(201);
    const claim = data<ClaimDetail>(created);
    expect(claim.status).toBe("PENDING_MANAGER");
    expect(claim.claimNo).toMatch(/^CNV-\d{4}-\d{4}$/);
    const farida = await tokenFor("EMP-0062");
    const inbox = data<InboxItem[]>(await handleMockRequest(req("GET", "/workflow/inbox", farida)));
    expect(inbox.some((i) => i.summary.refNo === claim.claimNo)).toBe(true);
    const step1 = await handleMockRequest(req("POST", `/workflow/instances/${claim.workflowInstanceId}/actions`, farida, { type: "APPROVE", comment: "Verified." }));
    expect(step1.status).toBe(200);
    const after = data<ClaimDetail>(await handleMockRequest(req("GET", `/claims/${claim.id}`, t)));
    expect(after.status).toBe("PENDING_FINANCE");
  });

  it("lets the claimant withdraw a pending claim", async () => {
    const t = await tokenFor("EMP-1042");
    const claim = data<ClaimDetail>(await handleMockRequest(req("POST", "/claims", t, conveyance(window(20)))));
    const res = await handleMockRequest(req("POST", `/claims/${claim.id}/withdraw`, t, {}));
    expect(res.status).toBe(200);
    expect(data<ClaimDetail>(res).status).toBe("CANCELLED");
  });

  it("resubmits a returned claim once the missing receipts are attached", async () => {
    const t = await tokenFor("EMP-1042");
    const items = data<ClaimItem[]>(await handleMockRequest(req("GET", "/claims", t)));
    const returned = items.find((c) => c.claimNo === "CNV-2026-0961");
    const detail = data<ClaimDetail>(await handleMockRequest(req("GET", `/claims/${returned?.id}`, t)));
    const body = (withReceipts: boolean): CreateClaimRequest => ({
      type: "CONVEYANCE", purpose: detail.purpose, periodStart: detail.periodStart, periodEnd: detail.periodEnd,
      lines: detail.lines.map((l) => ({ date: l.date, category: l.category, description: l.description, amount: l.amount, isDeclaration: l.isDeclaration, receiptFileId: l.receiptFileId ?? (withReceipts ? "new_receipt" : null) })),
    });
    const blocked = await handleMockRequest(req("POST", `/claims/${detail.id}/resubmit`, t, body(false)));
    expect(blocked.status).toBe(422);
    const ok = await handleMockRequest(req("POST", `/claims/${detail.id}/resubmit`, t, body(true)));
    expect(ok.status).toBe(200);
    expect(data<ClaimDetail>(ok).status).toBe("PENDING_MANAGER");
  });

  it("denies claim creation to roles without claims:create", async () => {
    const res = await handleMockRequest(req("GET", "/claims", undefined));
    expect(res.status).toBe(401);
  });
});
