import type { Href } from "expo-router";

/** Single source of in-app paths; server-provided `route` strings are mapped through `fromServerRoute`. */
export const routes = {
  login: "/login" as Href,
  home: "/" as Href,
  inbox: "/inbox" as Href,
  notifications: "/notifications" as Href,
  approval: (id: string) => `/approvals/${id}` as Href,
  approvalHistory: "/approvals/history" as Href,
  notices: "/notices" as Href,
  notice: (id: string) => `/notices/${id}` as Href,
  composeNotice: "/notices/compose" as Href,
  broadcast: "/notices/broadcast" as Href,
  attendance: "/attendance" as Href,
  attendanceHistory: "/attendance/history" as Href,
  regularise: "/attendance/regularise" as Href,
  regulariseFor: (date: string, type: string) => ({ pathname: "/attendance/regularise", params: { date, type } }) as unknown as Href,
  leave: "/leave" as Href,
  newLeave: "/leave/new" as Href,
  leaveRequest: (id: string) => `/leave/${id}` as Href,
  claims: "/claims" as Href,
  newClaim: "/claims/new" as Href,
  claim: (id: string) => `/claims/${id}` as Href,
  resubmitClaim: (id: string) => ({ pathname: "/claims/new", params: { from: id } }) as unknown as Href,
  profile: "/profile" as Href,
  settings: "/settings" as Href,
};

/**
 * Single registry of paths that have a registered screen. Anything linked from the home quick actions,
 * the More grid or a server `route` must pass `isRouteBuilt`, so a tap never lands on a dead end.
 * Add a path here in the same change that adds its screen.
 */
const BUILT_EXACT = [
  "/",
  "/inbox",
  "/notifications",
  "/profile",
  "/settings",
  "/attendance",
  "/attendance/history",
  "/attendance/regularise",
  "/leave",
  "/leave/new",
  "/claims",
  "/claims/new",
  "/notices",
  "/notices/compose",
  "/notices/broadcast",
  "/approvals/history",
];
const BUILT_PREFIXES = ["/approvals/", "/notices/", "/leave/", "/attendance/", "/claims/"];

export function isRouteBuilt(path: string): boolean {
  const clean = path.split("?")[0] ?? path;
  return BUILT_EXACT.includes(clean) || BUILT_PREFIXES.some((p) => clean.startsWith(p) && clean.length > p.length);
}

export function fromServerRoute(route: string | undefined, fallback: Href = routes.inbox): Href {
  if (route && isRouteBuilt(route)) return route as Href;
  return fallback;
}