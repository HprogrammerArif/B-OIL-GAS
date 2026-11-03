import { fromServerRoute, isRouteBuilt, routes } from "../routes";

describe("isRouteBuilt", () => {
  it("accepts screens that exist", () => {
    for (const p of ["/", "/inbox", "/leave/new", "/leave/lv_1", "/approvals/wfi_1", "/notices/broadcast", "/attendance/regularise"]) {
      expect(isRouteBuilt(p)).toBe(true);
    }
  });

  it("rejects modules that are not built yet", () => {
    for (const p of ["/claims/new", "/fleet/requisitions/new", "/visitors/scan", "/incidents/report", "/parcels/new", "/note-sheets/new", "/outbox", "/leave/"]) {
      expect(isRouteBuilt(p)).toBe(false);
    }
  });

  it("falls back for unbuilt server routes", () => {
    expect(fromServerRoute("/claims/abc")).toBe(routes.inbox);
    expect(fromServerRoute("/approvals/wfi_1")).toBe("/approvals/wfi_1");
  });
});
