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
  profile: "/profile" as Href,
  settings: "/settings" as Href,
};

/** Only prefixes with a registered screen; anything else falls back so a tap never lands on "unmatched route". */
const KNOWN_PREFIXES = ["/approvals/", "/notices/"];

export function fromServerRoute(route: string | undefined, fallback: Href = routes.inbox): Href {
  if (route && KNOWN_PREFIXES.some((p) => route.startsWith(p))) return route as Href;
  return fallback;
}
