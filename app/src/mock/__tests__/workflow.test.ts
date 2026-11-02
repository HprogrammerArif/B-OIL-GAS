import { handleMockRequest, setMockLatency } from "../server";
import type { MockRequest } from "../http";
import type { InboxItem, WorkflowInstance } from "@/types/domain/workflow";

const device = { id: "test-device", name: "Jest", platform: "ANDROID" as const };

function req(method: MockRequest["method"], path: string, token?: string, body: unknown = null, query: Record<string, string> = {}): MockRequest {
  return { method, path, query, body, headers: token ? { authorization: `Bearer ${token}` } : {} };
}

async function tokenFor(empCode: string): Promise<string> {
  const res = await handleMockRequest(req("POST", "/__demo/session", undefined, { empCode, device }));
  return (res.body as { data: { accessToken: string } }).data.accessToken;
}

async function inbox(token: string, query: Record<string, string> = {}): Promise<InboxItem[]> {
  const res = await handleMockRequest(req("GET", "/workflow/inbox", token, null, query));
  return (res.body as { data: InboxItem[] }).data;
}

const act = (token: string, id: string, body: unknown) =>
  handleMockRequest(req("POST", `/workflow/instances/${id}/actions`, token, body));

beforeAll(() => setMockLatency(0, 0));

describe("workflow inbox", () => {
  it("routes each seeded item to the persona who decides it", async () => {
    const chairman = await inbox(await tokenFor("EMP-0001"));
    expect(chairman.map((i) => i.summary.refNo).sort()).toEqual(["ARQ-2026-022", "BOGCL/PLANT/2026/0894"]);
    const farida = await inbox(await tokenFor("EMP-0062"));
    expect(farida.map((i) => i.summary.refNo)).toEqual(
      expect.arrayContaining(["TADA-2026-0419", "LV-2026-089", "REQ-2026-0441", "TADA-2026-0402"]),
    );
  });

  it("denies the inbox to roles without workflow:inbox", async () => {
    const res = await handleMockRequest(req("GET", "/workflow/inbox", await tokenFor("EMP-1042")));
    expect(res.status).toBe(403);
  });

  it("lets the chairman see the company pipeline as read-only rows", async () => {
    const all = await inbox(await tokenFor("EMP-0001"), { view: "all" });
    expect(all.length).toBeGreaterThan(5);
    expect(all.filter((i) => !i.readOnly).length).toBe(2);
  });
});

describe("workflow actions", () => {
  it("advances a claim from department head to finance", async () => {
    const farida = await tokenFor("EMP-0062");
    const res = await act(farida, "wfi_tada_2026_0419", { type: "APPROVE", comment: "Receipts verified." });
    expect(res.status).toBe(200);
    const instance = (res.body as { data: { instance: WorkflowInstance } }).data.instance;
    expect(instance.status).toBe("IN_REVIEW");
    expect(instance.currentStepNo).toBe(2);
  });

  it("returns 409 when the step was already decided", async () => {
    const farida = await tokenFor("EMP-0062");
    const res = await act(farida, "wfi_cnv_2026_0961", { type: "APPROVE" });
    expect(res.body).toMatchObject({ error: { code: "INVALID_STATE_TRANSITION" } });
  });

  it("requires a reason of at least ten characters to return", async () => {
    const farida = await tokenFor("EMP-0062");
    const res = await act(farida, "wfi_cnv_2026_1002", { type: "RETURN", comment: "no" });
    expect(res.status).toBe(422);
  });

  it("hides items from non-participants with 404", async () => {
    const harunur = await tokenFor("EMP-0012");
    const res = await act(harunur, "wfi_lv_2026_089", { type: "APPROVE" });
    expect(res.status).toBe(404);
  });

  it("forbids a past participant from acting on the current step", async () => {
    const farida = await tokenFor("EMP-0062");
    const res = await act(farida, "wfi_arq_2026_022", { type: "APPROVE" });
    expect(res.status).toBe(403);
  });

  it("requires a valid OTP for signature steps", async () => {
    const chairman = await tokenFor("EMP-0001");
    const id = "wfi_bogcl_plant_2026_0894";
    const without = await act(chairman, id, { type: "APPROVE" });
    expect(without.status).toBe(422);
    const otp = await handleMockRequest(req("POST", `/workflow/instances/${id}/signature-otp`, chairman));
    const code = (otp.body as { data: { demoCode: string } }).data.demoCode;
    const wrong = await act(chairman, id, { type: "APPROVE", signature: { method: "TYPED", otpCode: code === "000000" ? "111111" : "000000" } });
    expect(wrong.status).toBe(422);
    const signed = await act(chairman, id, { type: "APPROVE", signature: { method: "TYPED", otpCode: code } });
    const instance = (signed.body as { data: { instance: WorkflowInstance } }).data.instance;
    expect(instance.status).toBe("APPROVED");
    expect(instance.steps.at(-1)?.signatureHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("notifies the requester when an item is returned", async () => {
    const farida = await tokenFor("EMP-0062");
    await act(farida, "wfi_cnv_2026_1002", {
      type: "RETURN",
      comment: "Please attach the CNG receipts.",
      details: { reasonCategory: "Missing receipts" },
    });
    const tanvir = await tokenFor("EMP-1042");
    const res = await handleMockRequest(req("GET", "/notifications", tanvir, null, { unread: "true" }));
    const types = (res.body as { data: { type: string; title: string }[] }).data.map((n) => `${n.type}:${n.title}`);
    expect(types).toContain("APPROVAL_RETURNED:CNV-2026-1002 returned for correction");
  });

  it("skips signature steps in batch approval", async () => {
    const chairman = await tokenFor("EMP-0001");
    const res = await handleMockRequest(
      req("POST", "/workflow/instances/batch-actions", chairman, { instanceIds: ["wfi_arq_2026_022"], type: "APPROVE" }),
    );
    expect(res.body).toMatchObject({ data: { results: [{ ok: false, error: { code: "POLICY_VIOLATION" } }] } });
  });
});
